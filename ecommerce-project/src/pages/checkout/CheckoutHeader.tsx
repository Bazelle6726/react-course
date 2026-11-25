import { Link } from 'react-router';
import CheckoutLockIcon from '../../assets/images/icons/checkout-lock-icon.png';
import Logo from '../../assets/images/logo.png';
import MobileLogo from '../../assets/images/mobile-logo.png';
import './CheckoutHeader.css';

/** The checkout page's own header: logo, item count and a lock icon. */
export function CheckoutHeader({ totalQuantity }: { totalQuantity: number }) {
    return (
        <div className="checkout-header">
            <div className="header-content">
                <div className="checkout-header-left-section">
                    <Link to="/">
                        <img className="logo" src={Logo} />
                        <img className="mobile-logo" src={MobileLogo} />
                    </Link>
                </div>

                <div className="checkout-header-middle-section">
                    Checkout (<Link className="return-to-home-link" to="/">
                        {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                    </Link>)
                </div>

                <div className="checkout-header-right-section">
                    <img src={CheckoutLockIcon} />
                </div>
            </div>
        </div>
    );
}
