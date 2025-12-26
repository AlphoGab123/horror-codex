import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="game-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="prompt" style={{ maxWidth: 360 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem' }}>Horror Codex</h1>
        <p style={{ margin: '0 0 12px', opacity: 0.8 }}>
          Step into a dimly lit corridor, find spare batteries, and keep your flashlight alive.
        </p>
        <Link className="link-button" href="/game">
          Enter the Prototype
        </Link>
      </div>
    </main>
  );
}
