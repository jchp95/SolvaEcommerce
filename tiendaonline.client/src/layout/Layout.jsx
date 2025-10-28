// src/Layout.js
import { Outlet } from 'react-router-dom';

import Hero from '../components/heroSection/Hero';

const Layout = () => {
    return (
        <>  
            <Outlet /> {/* Este es el lugar donde se renderizarán las rutas hijas */}
        </>
    );
};

export default Layout;