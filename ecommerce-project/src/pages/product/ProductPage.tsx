import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Header } from '../../components/Header';
import { PageMeta } from '../../components/PageMeta';
import { AddToCart } from '../../components/AddToCart';
import { productsQuery } from '../../api';
import { formatMoney } from '../../utils/money';
import './ProductPage.css';

export function ProductPage() {
    const { productId } = useParams();
    // The same list the home page shows, so it's usually already loaded.
    const { data: products, isPending, isError } = useQuery(productsQuery(''));
    const product = products?.find((item) => item.id === productId);

    let content;
    if (isError) {
        content = (
            <div className="load-error" role="alert">
                Sorry, we couldn't load this product. Please check the backend is running, then refresh.
            </div>
        );
    } else if (isPending) {
        content = <div className="page-message" role="status">Loading the product…</div>;
    } else if (!product) {
        content = <div className="page-message">We couldn't find that product.</div>;
    } else {
        content = (
            <div className="product-details">
                <div className="product-page-image-container">
                    <img className="product-page-image" src={product.image} alt={product.name} />
                </div>

                <div className="product-info">
                    <h1 className="product-title">{product.name}</h1>

                    <div className="product-rating-container">
                        <img className="product-rating-stars"
                            src={`images/ratings/rating-${product.rating.stars * 10}.png`}
                            alt={`${product.rating.stars} out of 5 stars`} />
                        <span className="product-rating-count">{product.rating.count} ratings</span>
                    </div>

                    <div className="product-price">{formatMoney(product.priceCents)}</div>

                    <div className="product-keywords">
                        {product.keywords.map((keyword) => (
                            <Link key={keyword} className="product-keyword" to={`/?search=${encodeURIComponent(keyword)}`}>
                                {keyword}
                            </Link>
                        ))}
                    </div>

                    <div className="product-buy-box">
                        <AddToCart product={product} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageMeta title={product?.name ?? 'Product'} favicon="home" />
            <Header />

            <div className="product-page">
                <Link className="back-to-products link-primary" to="/">← All products</Link>
                {content}
            </div>
        </>
    );
}
