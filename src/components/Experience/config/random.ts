// RANDOM INTEGER BETWEEN MIN AND MAX (BOTH INCLUDED)
export function getRandomInteger(min: number, max: number): number {

  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);

  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}
