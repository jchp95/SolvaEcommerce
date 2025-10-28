import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../reduxSlices/products/productsSlice';

export const useProducts = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  const isLoading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return {
    products,
    isLoading,
    error,
    createProduct: (data) => dispatch(createProduct(data)),
    updateProduct: ({ id, data }) => dispatch(updateProduct({ id, data })),
    deleteProduct: (id) => dispatch(deleteProduct(id)),
  };
};