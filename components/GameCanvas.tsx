import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Item, Particle, FOOD_ITEMS } from '../types';
import { isMouthOpen, getDistortedPoint } from '../utils';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  fatFactor: number;
  setFatFactor: React.Dispatch<React.SetStateAction<number>>;
  onGameEnd: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  score,
  setScore,
  fatFactor,
  setFatFactor,
  onGameEnd
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game Logic Refs (Mutable state that doesn't trigger re-renders)
  const itemsRef = useRef<Item[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnTime = useRef<number>(0);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const landmarksRef = useRef<any[] | null>(null);

  // Refs for props to avoid stale closures in MediaPipe callback
  const gameStateRef = useRef(gameState);
  const fatFactorRef = useRef(fatFactor);
  const onGameEndRef = useRef(onGameEnd);

  // Sync refs with props
  useEffect(() => {
    gameStateRef.current = gameState;
    fatFactorRef.current = fatFactor;
    onGameEndRef.current = onGameEnd;
  }, [gameState, fatFactor, onGameEnd]);

  // Initialize MediaPipe
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const onResults = (results: any) => {
      // Store landmarks for the game loop to use
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        landmarksRef.current = results.multiFaceLandmarks[0];
      } else {
        landmarksRef.current = null;
      }
      
      // We also draw the video feed here immediately to ensure sync
      drawFrame(results.image);
    };

    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;

    if (videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      // Cleanup
      if (cameraRef.current) cameraRef.current.stop();
      if (faceMeshRef.current) faceMeshRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Watch for Ready State
  useEffect(() => {
    // If we have landmarks for the first time, switch to READY
    const checkReady = setInterval(() => {
      if (landmarksRef.current && gameState === GameState.LOADING) {
        setGameState(GameState.READY);
        clearInterval(checkReady);
      }
    }, 500);
    return () => clearInterval(checkReady);
  }, [gameState, setGameState]);


  // Helper: Create Confetti
  const spawnConfetti = (x: number, y: number) => {
    const colors = ['#FFD700', '#FF0000', '#00FF00', '#00FFFF', '#FF00FF'];
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 1) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
      });
    }
  };

  // Main Draw & Logic Function
  const drawFrame = (videoImage: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Setup Canvas Dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 2. Draw Distorted Video (The "Fat" Effect)
    ctx.save();
    
    // Default nose position (center of screen) if not found
    let noseX = canvas.width / 2;
    let noseY = canvas.height / 2;

    if (landmarksRef.current) {
      // Landmark 1 is the nose tip
      noseX = landmarksRef.current[1].x * canvas.width;
      noseY = landmarksRef.current[1].y * canvas.height;
    }

    const currentFatFactor = fatFactorRef.current;

    // Transformation Matrix for Horizontal Stretch from Nose Center
    // translate(noseX, 0) -> scale(fatFactor, 1) -> translate(-noseX, 0)
    ctx.translate(noseX, 0);
    ctx.scale(currentFatFactor, 1);
    ctx.translate(-noseX, 0);

    // Draw the webcam feed
    // Calculate aspect ratio to cover screen "object-fit: cover" style
    const imgAspect = videoImage.width / videoImage.height;
    const canvasAspect = canvas.width / canvas.height;
    let renderW, renderH, offsetX, offsetY;

    if (canvasAspect > imgAspect) {
      renderW = canvas.width;
      renderH = canvas.width / imgAspect;
      offsetX = 0;
      offsetY = (canvas.height - renderH) / 2;
    } else {
      renderH = canvas.height;
      renderW = canvas.height * imgAspect;
      offsetX = (canvas.width - renderW) / 2;
      offsetY = 0;
    }

    ctx.drawImage(videoImage, offsetX, offsetY, renderW, renderH);
    ctx.restore(); // Restore context for UI elements (items, text)

    // 3. Game Logic (Only if Playing)
    if (gameStateRef.current === GameState.PLAYING) {
      updateGameLogic(ctx, canvas.width, canvas.height);
    }
    
    // 4. Render Particles (Confetti) - Always render if they exist
    renderParticles(ctx, canvas.width, canvas.height);
  };

  const updateGameLogic = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const now = Date.now();
    const currentFatFactor = fatFactorRef.current;

    // Spawn Items
    if (now - lastSpawnTime.current > 1000) { // Spawn every 1s
      const item: Item = {
        id: Math.random(),
        x: Math.random() * 0.8 + 0.1, // Keep within 10-90% width
        y: -0.1,
        speed: 0.005 + (Math.random() * 0.005), // Random speed
        emoji: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)],
        type: 'food',
        scoreValue: 1,
      };
      itemsRef.current.push(item);
      lastSpawnTime.current = now;
    }

    // Mouth Detection Logic
    let isEating = false;
    let mouthX = 0;
    let mouthY = 0;

    if (landmarksRef.current && isMouthOpen(landmarksRef.current)) {
      isEating = true;
      // Get Mouth Center (Midpoint of lips 13 and 14)
      const uLip = landmarksRef.current[13];
      const lLip = landmarksRef.current[14];
      const nose = landmarksRef.current[1]; // Reference for distortion

      const rawMouthX = (uLip.x + lLip.x) / 2; 
      const rawMouthY = (uLip.y + lLip.y) / 2;

      // CRITICAL: We must apply the "Fat Distortion" to the mouth coordinates
      // because the user sees the distorted video and moves their head based on that.
      // The items are falling in "screen space" (undistorted X), but the mouth is at "distorted X".
      const distortedMouth = getDistortedPoint({ x: rawMouthX, y: rawMouthY }, nose, currentFatFactor);
      
      mouthX = distortedMouth.x * width;
      mouthY = distortedMouth.y * height;
      
      // Visual Debug for Mouth (Optional)
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, 20, 0, 2 * Math.PI);
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Update Items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      item.y += item.speed;

      const itemScreenX = item.x * width;
      const itemScreenY = item.y * height;

      // Draw Item
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.emoji, itemScreenX, itemScreenY);

      // Collision Detection
      let hit = false;
      if (isEating) {
        const dist = Math.sqrt(Math.pow(itemScreenX - mouthX, 2) + Math.pow(itemScreenY - mouthY, 2));
        if (dist < 60) { // Hit radius
          hit = true;
        }
      }

      if (hit) {
        // Eat Logic
        itemsRef.current.splice(i, 1);
        spawnConfetti(itemScreenX, itemScreenY);
        setScore(prev => prev + 1);
        
        // Increase Fat Factor
        setFatFactor(prev => {
          const newFat = prev + 0.05; // Get fatter
          if (newFat >= 2.0) { // Max fat limit -> End Game
             // We need to defer the game end to avoid state updates during render loop issues if possible, 
             // but here it's triggered by event.
             if (onGameEndRef.current) setTimeout(onGameEndRef.current, 0); 
          }
          return newFat;
        });
      } else if (item.y > 1.1) {
        // Remove off-screen
        itemsRef.current.splice(i, 1);
      }
    }
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.001; // Gravity
      p.life -= 0.02;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  return (
    <>
      {/* Hidden Video for MediaPipe Input */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }} // Mirror locally? No, MediaPipe handles it usually, but we draw manual
      />
      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />
    </>
  );
};

export default GameCanvas;