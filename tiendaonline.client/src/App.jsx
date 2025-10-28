import RouterPages from './RouterPages';
import Spinner from './components/Spinner.jsx';

function App() {
    return (
        <>
            <Spinner />
            <div>
                <RouterPages />
            </div>
        </>
    );
}

export default App;