import Navbar from './Navbar';
import { usePendingUnlockChecker } from '../hooks/usePendingUnlockChecker';

export default function Layout({ children }) {
  usePendingUnlockChecker();
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-content">{children}</main>
    </div>
  );
}