import useFlightStore from './store/flightStore';
import AirportSelector from './components/AirportSelector';
import DurationPicker from './components/DurationPicker';
import RouteList from './components/RouteList';
import FlightDisplay3D from './components/FlightDisplay3D';
import StatsSummary from './components/StatsSummary';

export default function App() {
  const { screen } = useFlightStore();

  return (
    <div className="app">
      {screen === 'airport-selection' && <AirportSelector />}
      {screen === 'duration-selection' && <DurationPicker />}
      {screen === 'route-selection' && <RouteList />}
      {screen === 'in-flight' && <FlightDisplay3D />}
      {screen === 'summary' && <StatsSummary />}
    </div>
  );
}
