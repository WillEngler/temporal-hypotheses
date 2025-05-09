import LK99Chart from './components/LK99Chart';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">LK-99 Veracity & Market Probability Visualization</h1>
        <p className="text-gray-600 mt-2">Interactive chart based on paper analysis and market data</p>
      </header>
      <main>
        <LK99Chart />
      </main>
    </div>
  );
}

export default App;
