import { Product } from './Product';
import type { Product as ProductType } from '../../types';

export function ProductsGrid({ products }: { products: ProductType[] }) {
    return (
        <div className="products-grid">
            {products.map((product) => {
                return (
                    <Product key={product.id} product={product} />
                );
            })}
        </div>
    )
}
