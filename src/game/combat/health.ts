export interface HealthComponent {
  readonly current: number;
  readonly max: number;
  takeDamage(amount: number): void;
  isDead(): boolean;
}

export function createHealth(max: number): HealthComponent {
  let current = max;

  return {
    get current() {
      return current;
    },
    get max() {
      return max;
    },
    takeDamage(amount: number) {
      current = Math.max(0, current - amount);
    },
    isDead() {
      return current <= 0;
    },
  };
}
