import { Link } from 'react-router';
import { AddToCart } from '../../components/AddToCart';
import { formatMoney } from '../../utils/money';
import type { Product as ProductType } from '../../types';

/** One card in the home page's product grid. */
export function Product({ product }: { product: ProductType }) {
    const productPage = `/products/${product.id}`;

    return (
        <div className="product-container"
            data-testid="product-container">
            <Link className="product-image-container" to={productPage} tabIndex={-1}>
                <img className="product-image"
                    data-testid="product-image"
                    src={product.image} />
            </Link>

            <Link className="product-name limit-text-to-2-lines" to={productPage}>
                {product.name}
            </Link>

            <div className="product-rating-container">
                <img className="product-rating-stars"
                    data-testid="product-rating-stars-image"
                    src={`images/ratings/rating-${product.rating.stars * 10}.png`} />
                <div className="product-rating-count link-primary">
                    {product.rating.count}
                </div>
            </div>

            <div className="product-price">
                {formatMoney(product.priceCents)}
            </div>

            <AddToCart product={product} />
        </div>
    );
}
