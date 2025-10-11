// src/Layout.js
import { Outlet } from 'react-router-dom';
import Home from '../pages/home/Home';

const Layout = () => {
    return (
        <>  
            <Home />
            <Outlet /> {/* Este es el lugar donde se renderizarán las rutas hijas */}
        </>
    );
};

export default Layout;