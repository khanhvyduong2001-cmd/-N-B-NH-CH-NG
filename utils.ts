// Calculate Euclidean distance between two points
export const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Check if mouth is open
// Upper lip bottom: 13, Lower lip top: 14
// Normalizer: Distance between top of head (10) and chin (152) to account for distance from camera
export const isMouthOpen = (landmarks: any[]) => {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const headTop = landmarks[10];
  const chin = landmarks[152];

  const mouthDist = getDistance(upperLip, lowerLip);
  const faceHeight = getDistance(headTop, chin);

  // Threshold ratio. If mouth opening is > 5% of face height, it's open.
  return (mouthDist / faceHeight) > 0.05;
};

// Transform a normalized point (0-1) based on the "Fat Factor" stretch
// The stretch happens from the nose center (landmark 1)
export const getDistortedPoint = (
  point: { x: number; y: number },
  nose: { x: number; y: number },
  fatFactor: number
) => {
  // Logic: The image is stretched horizontally away from the nose.
  // New X = NoseX + (OldX - NoseX) * FatFactor
  const newX = nose.x + (point.x - nose.x) * fatFactor;
  return { x: newX, y: point.y };
};
