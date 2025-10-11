import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion'; // Importa motion
import Home from './pages/home/Home';
import Layout from './layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/Register';
import CartPage from './pages/Cart/CartPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CategoriesList from './pages/dashboard/category/CategoriesList';
import ProductsList from './pages/dashboard/product/ProductsList';
import SearchResultsPage from './pages/products/SearchResultsPage';
import ProductPage from './pages/products/ProductPage';
import CheckoutPage from './pages/checkoutPage/CheckoutPage';
import Orders from './pages/order/Orders';
import ReportsPage from './pages/dashboard/reports/ReportsList';
import UsersList from './pages/dashboard/users/UsersList'; // Importa UsersList
import SecuritySettings from './pages/dashboard/security/SecuritySettings'; // Importa SecuritySettings
import SiteSettings from './pages/dashboard/settings/SiteSettings'; // Importa SiteSettings


// Componente para manejar la animación de las rutas
const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Ruta principal con Layout */}
                <Route path="/" element={<Layout />}>
                    <Route
                        index
                        element={
                            <ProtectedRoute>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Home />
                                </motion.div>
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* Otras rutas con animación */}
                <Route
                    path="/login"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <LoginPage />
                        </motion.div>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <RegisterPage />
                        </motion.div>
                    }
                />

                {/* Ruta para registro si la tienes */}
                <Route path="/cart" element={<CartPage />} />

                <Route
                    path="/checkout"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CheckoutPage />
                        </motion.div>
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Orders />
                        </motion.div>
                    }
                />

                {/* Repite para todas las rutas que necesites animar */}
                <Route
                    path="/dashboard"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AdminDashboard />
                        </motion.div>
                    }
                />
                <Route
                    path="/categories"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CategoriesList />
                        </motion.div>
                    }
                />

                <Route
                    path="/products"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProductsList />
                        </motion.div>
                    }
                />

                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                
                {/* Ruta para ReportsList */}
                <Route
                    path="/reports"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ReportsPage />
                        </motion.div>
                    }
                /> 

                <Route
                    path="/users"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <UsersList />
                        </motion.div>
                    }
                />

                <Route
                    path="/security"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SecuritySettings />
                        </motion.div>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SiteSettings />
                        </motion.div>
                    }
                />

            </Routes>
        </AnimatePresence>
    );
};

export function RouterPages() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default RouterPages;