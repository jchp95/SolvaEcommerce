import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
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
import Orders from './pages/dashboard/order/Orders';
import OrderConfirmationPage from './pages/order/OrderConfirmationPage';
import ReportsPage from './pages/dashboard/reports/ReportsList';
import UsersList from './pages/dashboard/users/UsersList';
import SecuritySettings from './pages/dashboard/security/SecuritySettings';
import SiteSettings from './pages/dashboard/settings/SiteSettings';
import ContactUs from './pages/contact/ContactUs';
import About from './pages/about/About';
import SupplierRegistration from './pages/supplierRegister/SupplierRegistration';
import SupplierProfile from './pages/dashboard/supplier/SupplierProfile';
import SupplierDashboard from './pages/dashboard/SupplierDashboard';
import CustomerProfile from './pages/profile/CustomerProfile';


// Componente para manejar la animación de las rutas
const AnimatedRoutes = () => {
    const location = useLocation();
    
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Rutas públicas */}
                <Route path="/" element={<Layout />}>
                    <Route
                        index
                        element={
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Home />
                            </motion.div>
                        }
                    />
                    <Route path="store" element={<div>Store pública</div>} />
                    <Route 
                        path="about" 
                        element={
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                transition={{ duration: 0.3 }}
                            >
                                <About />
                            </motion.div>
                        } 
                    />
                    <Route 
                        path="contact" 
                        element={
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                transition={{ duration: 0.3 }}
                            >
                                <ContactUs />
                            </motion.div>
                        } 
                    />
                </Route>

                {/* Registro de proveedor (pública) */}
                <Route 
                    path="/supplier/register" 
                    element={
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <SupplierRegistration />
                        </motion.div>
                    } 
                />

                

                {/* Rutas protegidas del dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AdminDashboard />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/categories"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CategoriesList />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProductsList />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CustomerProfile />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ReportsPage />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                {/* Perfil del proveedor (protegida) */}
                <Route
                    path="/supplier/profile"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SupplierProfile />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                {/* Dashboard del proveedor (protegida) */}
                <Route
                    path="/supplier/dashboard"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SupplierDashboard />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <UsersList />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/security"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SecuritySettings />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SiteSettings />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Orders />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/my-orders"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Orders />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CheckoutPage />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/order-confirmation"
                    element={
                        <ProtectedRoute>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <OrderConfirmationPage />
                            </motion.div>
                        </ProtectedRoute>
                    }
                />

                {/* Rutas públicas adicionales */}
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
                <Route path="/cart" element={<CartPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
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