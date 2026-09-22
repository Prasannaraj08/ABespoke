import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Plus,
  Check,
  CheckCircle,
  Gift,
  QrCode,
  Smartphone,
  AlertCircle,
  X,
  Banknote
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI } from '../services/api';

type PaymentMethodType = 'COD' | 'UPI' | 'CARD' | 'GIFT_CARD';
type UpiProviderType = 'phonepe' | 'gpay' | 'paytm' | 'other';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, pricing, coupon, clearCart } = useCart();

  // Step 1: Delivery Address | Step 2: Payment & Order Confirmation
  const [step, setStep] = useState<1 | 2>(1);

  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSaveAndProceed, setAddressSaveAndProceed] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Shipping details
  const [shippingMethod, setShippingMethod] = useState<'Standard' | 'Express'>('Standard');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [slotsList, setSlotsList] = useState<string[]>([]);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('COD');
  
  // UPI Sub-options
  const [upiProvider, setUpiProvider] = useState<UpiProviderType>('phonepe');
  const [upiVpa, setUpiVpa] = useState('');
  const [upiMode, setUpiMode] = useState<'id' | 'qr'>('id');
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiError, setUpiError] = useState('');

  // Card details
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    saveCard: true
  });
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | 'amex' | 'generic'>('generic');

  // Gift Card details
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [giftCardApplied, setGiftCardApplied] = useState(false);
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardSuccess, setGiftCardSuccess] = useState('');

  // Loading & Processing
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/');
      return;
    }

    fetchAddresses();
    generateDeliverySlots();
  }, [user, authLoading]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const data = await checkoutAPI.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const def = data.find((a: any) => a.isDefault);
        setSelectedAddressId(def ? def.id : data[0].id);
      } else {
        // Auto show form if no address exists yet
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const generateDeliverySlots = () => {
    const list: string[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const dayNum = date.getDate();
      list.push(`${dayName}, ${dayNum} ${monthName} (9:00 AM - 1:00 PM)`);
      list.push(`${dayName}, ${dayNum} ${monthName} (2:00 PM - 6:00 PM)`);
    }
    setSlotsList(list);
    setDeliverySlot(list[0]);
  };

  // Detect card type from number
  const handleCardNumberChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, '').slice(0, 16);
    // Format with spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;

    if (cleaned.startsWith('4')) setCardType('visa');
    else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) setCardType('mastercard');
    else if (/^(60|65|81|82)/.test(cleaned)) setCardType('rupay');
    else if (/^3[47]/.test(cleaned)) setCardType('amex');
    else setCardType('generic');

    setCardDetails(prev => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardDetails(prev => ({ ...prev, expiry: `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` }));
    } else {
      setCardDetails(prev => ({ ...prev, expiry: cleaned }));
    }
  };

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!newAddress.name.trim() || !newAddress.phone.trim() || !newAddress.street.trim() ||
        !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
      setAddressError('Please fill in all address fields.');
      return;
    }

    if (newAddress.phone.replace(/\D/g, '').length < 10) {
      setAddressError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (newAddress.pincode.replace(/\D/g, '').length !== 6) {
      setAddressError('Please enter a valid 6-digit postal pincode.');
      return;
    }

    try {
      const addr = await checkoutAPI.addAddress(newAddress);
      setAddresses(prev => [...prev, addr]);
      setSelectedAddressId(addr.id);
      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });

      // If user clicked "Save Address & Proceed to Payment"
      if (addressSaveAndProceed) {
        setStep(2);
      }
    } catch (err: any) {
      setAddressError(err?.response?.data?.message || 'Failed to save address, please check fields.');
    }
  };

  // Apply Gift Card
  const handleApplyGiftCard = (sampleMode = false) => {
    setGiftCardError('');
    setGiftCardSuccess('');

    const code = sampleMode ? 'BESPOKE-LUXE-2026' : giftCardCode.trim().toUpperCase();
    const pin = sampleMode ? '8842' : giftCardPin.trim();

    if (!code || pin.length < 4) {
      setGiftCardError('Please enter a valid Gift Card voucher code and 4-digit PIN.');
      return;
    }

    if (sampleMode) {
      setGiftCardCode('BESPOKE-LUXE-2026');
      setGiftCardPin('8842');
    }

    const availableBalance = 2500;
    const currentTotal = pricing.total + (shippingMethod === 'Express' ? 99 : 0);
    const applicableDiscount = Math.min(currentTotal, availableBalance);

    setGiftCardApplied(true);
    setGiftCardBalance(availableBalance);
    setGiftCardDiscount(applicableDiscount);
    setGiftCardSuccess(`Gift Card applied! ₹${applicableDiscount} deducted from your payable total.`);
  };

  const handleRemoveGiftCard = () => {
    setGiftCardApplied(false);
    setGiftCardBalance(0);
    setGiftCardDiscount(0);
    setGiftCardCode('');
    setGiftCardPin('');
    setGiftCardSuccess('');
    setGiftCardError('');
  };

  // UPI VPA Verification Simulation
  const handleVerifyUpi = () => {
    if (!upiVpa.trim() || !upiVpa.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. 9876543210@ybl)');
      setUpiVerified(false);
      return;
    }
    setUpiError('');
    setUpiVerified(true);
  };

  // Calculations
  const shippingFee = shippingMethod === 'Express' ? 99 : 0;
  const baseTotalWithShipping = pricing.total + shippingFee;
  const finalPayableTotal = Math.max(0, baseTotalWithShipping - (giftCardApplied ? giftCardDiscount : 0));
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // Execute Final Order Checkout
  const executeOrderCheckout = async () => {
    if (!selectedAddressId) {
      setStep(1);
      alert('Please select or add a delivery address first.');
      return;
    }

    // Basic frontend validations for chosen payment method
    if (paymentMethod === 'CARD') {
      const cleanCard = cardDetails.number.replace(/\s/g, '');
      if (cleanCard.length < 15 || !cardDetails.name.trim() || !cardDetails.expiry || cardDetails.cvv.length < 3) {
        alert('Please fill in complete and valid card details (16-digit card number, name, MM/YY, 3-digit CVV).');
        return;
      }
    } else if (paymentMethod === 'UPI' && upiMode === 'id' && !upiVpa.trim()) {
      alert('Please enter your UPI ID or choose QR Code payment.');
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage('Verifying inventory & reserving bespoke pieces...');

    setTimeout(() => {
      if (paymentMethod === 'COD') {
        setPaymentMessage('Registering Cash on Delivery doorstep order...');
      } else if (paymentMethod === 'UPI') {
        setPaymentMessage(`Connecting to ${upiProvider.toUpperCase()} UPI Gateway...`);
      } else if (paymentMethod === 'GIFT_CARD') {
        setPaymentMessage('Redeeming ABespoke Gift Voucher balance...');
      } else {
        setPaymentMessage('Authorizing transaction with 256-bit bank encryption...');
      }
    }, 700);

    setTimeout(async () => {
      try {
        let recordedPaymentMethod: string = paymentMethod;
        if (paymentMethod === 'UPI') {
          recordedPaymentMethod = `UPI_${upiProvider.toUpperCase()}`;
        }

        const orderPayload = {
          addressId: selectedAddressId,
          paymentMethod: recordedPaymentMethod,
          couponCode: coupon?.code || null,
          items: cartItems.map(item => ({
            productId: item.productId,
            title: item.product.title,
            brand: item.product.brand,
            size: item.size || 'Standard',
            color: item.color || 'Standard',
            quantity: item.quantity,
            price: Math.round(item.product.price * (1 - item.product.discount / 100)),
            image: item.product.images[0]
          })),
          summary: {
            subtotal: pricing.subtotal,
            discount: pricing.productDiscount + pricing.couponDiscount + (giftCardApplied ? giftCardDiscount : 0),
            tax: pricing.tax,
            shipping: pricing.shipping + shippingFee,
            total: finalPayableTotal
          }
        };

        const result = await checkoutAPI.createOrder(orderPayload);

        setPaymentMessage('Transaction Approved! Generating bespoke order invoice...');

        setTimeout(() => {
          clearCart();
          setPaymentLoading(false);
          navigate(`/order-confirmation?orderId=${result.order.id}`);
        }, 800);

      } catch (err: any) {
        setPaymentLoading(false);
        alert(err.response?.data?.message || 'Payment authentication failed. Please try another payment method.');
      }
    }, 1600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans space-y-8">
      
      {/* Header */}
      <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold">
            Official Checkout
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark uppercase tracking-wide">
            Secure Checkout
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
            step === 1 ? 'bg-luxury-dark text-white' : 'bg-green-100 text-green-800'
          }`}>
            {step > 1 ? <Check className="w-3 h-3" /> : '1'} Address
          </span>
          <span className="text-neutral-300">──</span>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
            step === 2 ? 'bg-luxury-dark text-white' : 'bg-neutral-100 text-neutral-600'
          }`}>
            2 Payment & Review
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Wizard */}
        <div className="w-full lg:w-[65%] space-y-6">

          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-[#FAF9F6]">
              <h3 className="font-serif text-base font-bold text-luxury-dark flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-luxury-dark text-white' : 'bg-green-600 text-white'
                }`}>
                  {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </span>
                Delivery Address
              </h3>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-luxury-gold hover:text-luxury-dark uppercase tracking-wider cursor-pointer"
                >
                  Change Address
                </button>
              )}
            </div>

            {/* Address Step Body */}
            {step === 1 ? (
              <div className="p-6 space-y-6">
                {addressLoading ? (
                  <p className="text-xs text-neutral-500">Loading your saved delivery addresses...</p>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-xs text-neutral-500 font-light">
                      No saved addresses found. Please add your shipping address to proceed to payment.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Shipping Address
                    </button>
                  </div>
                ) : !showAddressForm ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                              isSelected
                                ? 'border-luxury-dark bg-[#FAF9F5] shadow-xs'
                                : 'border-neutral-200 hover:border-luxury-gold/60 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-luxury-dark bg-luxury-dark text-white' : 'border-neutral-300'
                                }`}>
                                  {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </span>
                                <p className="font-bold text-xs text-luxury-dark">{addr.name}</p>
                              </div>
                              {addr.isDefault && (
                                <span className="bg-amber-100/70 text-amber-900 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 mt-2 leading-relaxed font-light pl-6">
                              {addr.street},<br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-xs text-luxury-dark mt-2 font-medium pl-6">
                              📱 {addr.phone}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Actions for Address Selection */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="text-xs font-bold text-luxury-gold flex items-center gap-1.5 hover:text-luxury-dark transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add New Address
                      </button>

                      {/* Explicit "Proceed to Payment" Button as requested */}
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!selectedAddressId}
                        className="w-full sm:w-auto bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:bg-zinc-200"
                      >
                        <span>Proceed to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Add Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="space-y-4 font-sans bg-[#FAF9F6] p-5 rounded-xl border border-neutral-200">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-dark flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-luxury-gold" /> Add New Delivery Address
                      </h4>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {addressError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{addressError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">10-Digit Mobile Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="font-bold text-neutral-700">Street / Flat / Locality Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Flat / Villa No., Street Name, Landmark"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">City / District *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mumbai"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">State *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maharashtra"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Pincode (6 Digits) *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="400001"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                        />
                      </div>
                      <div className="space-y-1 flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="default_addr"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="accent-luxury-gold w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="default_addr" className="font-semibold text-neutral-700 cursor-pointer">
                          Set as default shipping profile
                        </label>
                      </div>
                    </div>

                    {/* Form Action Buttons: Features "Proceed to Payment" */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-neutral-200">
                      <button
                        type="submit"
                        onClick={() => setAddressSaveAndProceed(true)}
                        className="bg-luxury-gold hover:bg-[#a3803b] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <span>Save Address & Proceed to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        onClick={() => setAddressSaveAndProceed(false)}
                        className="border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl bg-white transition-colors cursor-pointer"
                      >
                        Save Address Only
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-neutral-500 hover:text-neutral-800 text-xs font-semibold px-3 py-3 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Collapsed Address State when on Step 2 */
              selectedAddress && (
                <div className="p-4 px-6 flex justify-between items-center bg-[#FAF9F6] text-xs">
                  <div>
                    <p className="font-bold text-luxury-dark">{selectedAddress.name} <span className="font-normal text-neutral-500">(Ph: {selectedAddress.phone})</span></p>
                    <p className="text-neutral-600 font-light mt-0.5">
                      {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-luxury-gold hover:underline font-bold text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )
            )}
          </div>

          {/* STEP 2: PAYMENT & ORDER CONFIRMATION */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-[#FAF9F6]">
              <h3 className="font-serif text-base font-bold text-luxury-dark flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-luxury-dark text-white' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  2
                </span>
                Payment & Order Review
              </h3>
            </div>

            {step === 2 ? (
              <div className="p-6 space-y-6">
                
                {/* Delivery Preferences (Speed & Slot) */}
                <div className="space-y-3 p-4 bg-[#FAF9F6] rounded-xl border border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-dark flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-luxury-gold" /> Delivery Speed & Slot
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-light">Choose your preferred shipping schedule</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShippingMethod('Standard')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          shippingMethod === 'Standard'
                            ? 'bg-luxury-dark text-white border-luxury-dark'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        Standard (FREE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingMethod('Express')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          shippingMethod === 'Express'
                            ? 'bg-luxury-dark text-white border-luxury-dark'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        Express (+₹99)
                      </button>
                    </div>
                  </div>

                  {/* Slot dropdown */}
                  <div className="pt-2 border-t border-neutral-200/60">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Scheduled Delivery Slot:</label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full mt-1 bg-white border border-neutral-200 rounded-lg p-2 text-xs font-medium text-neutral-800 focus:outline-none focus:border-luxury-gold cursor-pointer"
                    >
                      {slotsList.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items in Bag Review */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-dark">
                    Ordered Bespoke Items ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})
                  </h4>
                  <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden max-h-56 overflow-y-auto">
                    {cartItems.map((item, idx) => {
                      const discPrice = Math.round(item.product.price * (1 - item.product.discount / 100));
                      return (
                        <div key={idx} className="flex items-center gap-3.5 p-3 bg-white">
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="w-12 h-14 object-cover object-top rounded-lg bg-neutral-100 border border-neutral-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-luxury-dark truncate">{item.product.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-semibold text-luxury-dark">
                                Size: {item.size || 'Free Size'}
                              </span>
                              <span>Color: {item.color || 'Standard'}</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-xs text-luxury-dark">₹{discPrice * item.quantity}</p>
                            {item.product.discount > 0 && (
                              <p className="text-[10px] text-neutral-400 line-through">₹{item.product.price * item.quantity}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-dark flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Select Payment Method
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-light">100% Secure & Encrypted</span>
                  </div>

                  {/* Payment Tabs / Layout */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col md:flex-row">
                    
                    {/* Payment Navigation Side */}
                    <div className="w-full md:w-[38%] border-b md:border-b-0 md:border-r border-neutral-200 bg-[#FAF9F6] p-2 space-y-1.5">
                      
                      {/* COD */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`w-full text-left p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
                          paymentMethod === 'COD'
                            ? 'bg-white text-luxury-dark border border-neutral-200 shadow-sm ring-1 ring-luxury-gold/40'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-tight">Cash on Delivery (COD)</p>
                          <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Pay at doorstep</p>
                        </div>
                      </button>

                      {/* UPI */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`w-full text-left p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
                          paymentMethod === 'UPI'
                            ? 'bg-white text-luxury-dark border border-neutral-200 shadow-sm ring-1 ring-luxury-gold/40'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-violet-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-tight">UPI (Instant)</p>
                          <p className="text-[10px] text-neutral-400 font-normal mt-0.5">PhonePe, GPay, Paytm</p>
                        </div>
                      </button>

                      {/* Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`w-full text-left p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
                          paymentMethod === 'CARD'
                            ? 'bg-white text-luxury-dark border border-neutral-200 shadow-sm ring-1 ring-luxury-gold/40'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-tight">Credit/Debit/ATM Card</p>
                          <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Visa, Mastercard, RuPay</p>
                        </div>
                      </button>

                      {/* Gift Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('GIFT_CARD')}
                        className={`w-full text-left p-3 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer ${
                          paymentMethod === 'GIFT_CARD'
                            ? 'bg-white text-luxury-dark border border-neutral-200 shadow-sm ring-1 ring-luxury-gold/40'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-tight">Gift Card</p>
                          <p className="text-[10px] text-neutral-400 font-normal mt-0.5">Voucher / Store balance</p>
                        </div>
                      </button>

                    </div>

                    {/* Payment Details Body */}
                    <div className="w-full md:w-[62%] p-5 text-xs">

                      {/* 1. CASH ON DELIVERY (COD) */}
                      {paymentMethod === 'COD' && (
                        <div className="space-y-4">
                          <div className="border border-emerald-200 bg-emerald-50/70 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                              <Banknote className="w-4 h-4 text-emerald-700" />
                              <span>Cash on Delivery (COD) Selected</span>
                            </div>
                            <p className="text-xs text-emerald-900/90 leading-relaxed font-light">
                              Pay in cash or scan the courier executive's digital QR scanner (via PhonePe, GPay, or Paytm) at the time of delivery at your doorstep.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-emerald-800 font-medium">
                              <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded">✓ Zero advance payment</span>
                              <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded">✓ Doorstep package check</span>
                              <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded">✓ 7-Day easy exchange</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={executeOrderCheckout}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>Place Order with COD (₹{finalPayableTotal})</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 2. UPI PAYMENT (PhonePe, Google Pay, Paytm, Other) */}
                      {paymentMethod === 'UPI' && (
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-bold text-luxury-dark text-xs mb-1">Choose UPI Payment Provider</h5>
                            <p className="text-[11px] text-neutral-500 font-light">Select your preferred UPI app for instant authorization</p>
                          </div>

                          {/* App Selector Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* PhonePe */}
                            <button
                              type="button"
                              onClick={() => { setUpiProvider('phonepe'); setUpiVerified(false); }}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                upiProvider === 'phonepe'
                                  ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-xs'
                                  : 'border-neutral-200 hover:border-purple-300 text-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 mx-auto rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                                P
                              </div>
                              <span className="text-[11px] block">PhonePe</span>
                            </button>

                            {/* Google Pay */}
                            <button
                              type="button"
                              onClick={() => { setUpiProvider('gpay'); setUpiVerified(false); }}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                upiProvider === 'gpay'
                                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                                  : 'border-neutral-200 hover:border-blue-300 text-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 mx-auto rounded-full bg-white border border-neutral-200 flex items-center justify-center font-bold text-xs mb-1">
                                <span className="text-blue-500 font-bold">G</span>
                              </div>
                              <span className="text-[11px] block">Google Pay</span>
                            </button>

                            {/* Paytm */}
                            <button
                              type="button"
                              onClick={() => { setUpiProvider('paytm'); setUpiVerified(false); }}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                upiProvider === 'paytm'
                                  ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                                  : 'border-neutral-200 hover:border-sky-300 text-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 mx-auto rounded-full bg-[#002e6e] text-white flex items-center justify-center font-bold text-[10px] mb-1">
                                Pay
                              </div>
                              <span className="text-[11px] block">Paytm</span>
                            </button>

                            {/* Other UPI */}
                            <button
                              type="button"
                              onClick={() => { setUpiProvider('other'); setUpiVerified(false); }}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                upiProvider === 'other'
                                  ? 'border-neutral-800 bg-neutral-100 text-neutral-900 font-bold shadow-xs'
                                  : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 mx-auto rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs mb-1">
                                @
                              </div>
                              <span className="text-[11px] block">Other UPI</span>
                            </button>
                          </div>

                          {/* UPI Mode Tabs: Enter ID or Scan QR */}
                          <div className="flex border-b border-neutral-200 text-xs">
                            <button
                              type="button"
                              onClick={() => setUpiMode('id')}
                              className={`pb-2 px-3 font-bold cursor-pointer transition-colors ${
                                upiMode === 'id'
                                  ? 'border-b-2 border-luxury-dark text-luxury-dark'
                                  : 'text-neutral-500 hover:text-neutral-800'
                              }`}
                            >
                              Enter UPI ID
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpiMode('qr')}
                              className={`pb-2 px-3 font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                                upiMode === 'qr'
                                  ? 'border-b-2 border-luxury-dark text-luxury-dark'
                                  : 'text-neutral-500 hover:text-neutral-800'
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5" /> Scan QR Code
                            </button>
                          </div>

                          {/* Enter UPI ID Mode */}
                          {upiMode === 'id' ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="font-semibold text-neutral-700">
                                  {upiProvider === 'phonepe' && 'Enter PhonePe UPI ID or Mobile Number'}
                                  {upiProvider === 'gpay' && 'Enter Google Pay UPI ID'}
                                  {upiProvider === 'paytm' && 'Enter Paytm UPI ID / Mobile Number'}
                                  {upiProvider === 'other' && 'Enter Virtual Payment Address (VPA)'}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder={
                                      upiProvider === 'phonepe' ? 'e.g. 9876543210@ybl' :
                                      upiProvider === 'gpay' ? 'e.g. yourname@okaxis' :
                                      upiProvider === 'paytm' ? 'e.g. 9876543210@paytm' :
                                      'yourname@upi'
                                    }
                                    value={upiVpa}
                                    onChange={(e) => { setUpiVpa(e.target.value); setUpiVerified(false); setUpiError(''); }}
                                    className="flex-1 bg-white border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-luxury-gold font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleVerifyUpi}
                                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                </div>
                              </div>

                              {upiError && (
                                <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> {upiError}
                                </p>
                              )}

                              {upiVerified && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg flex items-center gap-1.5 font-medium text-xs animate-fadeIn">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span>UPI ID Verified: Ready to approve ₹{finalPayableTotal}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* QR Code Mode */
                            <div className="text-center p-4 bg-[#FAF9F6] rounded-xl border border-neutral-200 space-y-3">
                              <div className="w-36 h-36 bg-white border-2 border-neutral-800 rounded-xl mx-auto p-2 flex flex-col items-center justify-center shadow-xs">
                                <QrCode className="w-24 h-24 text-neutral-900" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-luxury-gold mt-1">
                                  {upiProvider.toUpperCase()} UPI
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600 font-light">
                                Scan this QR using <strong>{upiProvider === 'phonepe' ? 'PhonePe' : upiProvider === 'gpay' ? 'Google Pay' : upiProvider === 'paytm' ? 'Paytm' : 'Any UPI App'}</strong> to authorize <strong>₹{finalPayableTotal}</strong>.
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={executeOrderCheckout}
                            className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>Pay ₹{finalPayableTotal} via UPI</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 3. CREDIT / DEBIT / ATM CARD */}
                      {paymentMethod === 'CARD' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-luxury-dark text-xs">Enter Card Credentials</h5>
                            <div className="flex gap-1.5 text-[10px] font-bold text-neutral-400">
                              <span className={cardType === 'visa' ? 'text-blue-600 font-black' : ''}>VISA</span>
                              <span>•</span>
                              <span className={cardType === 'mastercard' ? 'text-orange-600 font-black' : ''}>MasterCard</span>
                              <span>•</span>
                              <span className={cardType === 'rupay' ? 'text-green-600 font-black' : ''}>RuPay</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-700">Card Number (16 Digits)</label>
                              <input
                                type="text"
                                maxLength={19}
                                placeholder="4532 8901 2345 6789"
                                value={cardDetails.number}
                                onChange={(e) => handleCardNumberChange(e.target.value)}
                                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono tracking-wider focus:outline-none focus:border-luxury-gold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-neutral-700">Cardholder Name</label>
                              <input
                                type="text"
                                placeholder="Name as printed on card"
                                value={cardDetails.name}
                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-luxury-gold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="font-semibold text-neutral-700">Expiry Date (MM/YY)</label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  placeholder="MM/YY"
                                  value={cardDetails.expiry}
                                  onChange={(e) => handleExpiryChange(e.target.value)}
                                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-luxury-gold text-center"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-semibold text-neutral-700">CVV / CVC</label>
                                <input
                                  type="password"
                                  maxLength={4}
                                  placeholder="3 or 4 digits"
                                  value={cardDetails.cvv}
                                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-luxury-gold text-center"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                id="save_card"
                                checked={cardDetails.saveCard}
                                onChange={(e) => setCardDetails({ ...cardDetails, saveCard: e.target.checked })}
                                className="accent-luxury-gold w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor="save_card" className="text-[11px] text-neutral-600 cursor-pointer font-light">
                                Save this card securely as per RBI tokenization guidelines
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={executeOrderCheckout}
                            className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>Pay ₹{finalPayableTotal} via Card</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 4. GIFT CARD */}
                      {paymentMethod === 'GIFT_CARD' && (
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-bold text-luxury-dark text-xs mb-1">Redeem ABespoke Gift Voucher</h5>
                            <p className="text-[11px] text-neutral-500 font-light">Apply your signature gift card balance to this purchase</p>
                          </div>

                          {giftCardSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{giftCardSuccess}</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveGiftCard}
                                className="text-red-600 hover:text-red-800 text-xs font-bold underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          {giftCardError && (
                            <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> {giftCardError}
                            </p>
                          )}

                          {!giftCardApplied ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="font-semibold text-neutral-700">16-Digit Gift Card Number</label>
                                <input
                                  type="text"
                                  placeholder="e.g. BESPOKE-LUXE-2026"
                                  value={giftCardCode}
                                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono uppercase focus:outline-none focus:border-luxury-gold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-semibold text-neutral-700">4-Digit PIN</label>
                                <input
                                  type="password"
                                  maxLength={4}
                                  placeholder="****"
                                  value={giftCardPin}
                                  onChange={(e) => setGiftCardPin(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-luxury-gold"
                                />
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleApplyGiftCard(false)}
                                  className="flex-1 bg-luxury-gold hover:bg-[#a3803b] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Apply Gift Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyGiftCard(true)}
                                  className="px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                                >
                                  Try Sample (₹2,500)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#FAF9F5] border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Voucher Code:</span>
                                <span className="font-mono font-bold text-luxury-dark">{giftCardCode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Total Gift Balance:</span>
                                <span className="font-bold text-luxury-dark">₹{giftCardBalance}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700 font-bold border-t border-amber-200/60 pt-2">
                                <span>Applied to this Order:</span>
                                <span>- ₹{giftCardDiscount}</span>
                              </div>
                              <div className="flex justify-between text-luxury-dark font-bold text-sm pt-1">
                                <span>Remaining to Pay:</span>
                                <span>₹{finalPayableTotal}</span>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={executeOrderCheckout}
                            className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>
                              {finalPayableTotal === 0
                                ? 'Pay ₹0 with Gift Card & Confirm'
                                : `Confirm Order (Pay Remaining ₹${finalPayableTotal})`}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                </div>

                {/* Back to Address button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 hover:text-luxury-dark transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Shipping Address
                  </button>
                </div>

              </div>
            ) : null}

          </div>

        </div>

        {/* Right Side: Order Price Summary Card */}
        <div className="w-full lg:w-[35%] bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 font-sans sticky top-24 shadow-xs">
          <h3 className="font-serif text-lg font-bold text-luxury-dark border-b border-neutral-100 pb-3">
            Price Summary
          </h3>
          
          <div className="space-y-2.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Bag Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
              <span>₹{pricing.subtotal}</span>
            </div>

            {pricing.productDiscount > 0 && (
              <div className="flex justify-between text-luxury-accent font-medium">
                <span>Product Discounts</span>
                <span>- ₹{pricing.productDiscount}</span>
              </div>
            )}

            {pricing.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Applied ({coupon?.code})</span>
                <span>- ₹{pricing.couponDiscount}</span>
              </div>
            )}

            {giftCardApplied && (
              <div className="flex justify-between text-amber-700 font-bold bg-amber-50/80 px-2 py-1 rounded">
                <span>Gift Card Voucher</span>
                <span>- ₹{giftCardDiscount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>GST / Taxes (12%)</span>
              <span>₹{pricing.tax}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>{shippingMethod === 'Express' ? '₹99 (Express)' : 'FREE'}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-luxury-dark border-t border-neutral-200 pt-3">
              <span>Payable Total</span>
              <span>₹{finalPayableTotal}</span>
            </div>
          </div>

          {/* Quick Step 1 "Proceed to Payment" Call to Action on Price Summary */}
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (!selectedAddressId && addresses.length > 0) {
                  setSelectedAddressId(addresses[0].id);
                  setStep(2);
                } else if (selectedAddressId) {
                  setStep(2);
                } else {
                  setShowAddressForm(true);
                  alert('Please add your shipping address to proceed to payment.');
                }
              }}
              className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-2"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Security Guarantee Badge */}
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-2.5 text-[10px] text-neutral-500 font-light leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>256-bit SSL encrypted PCI DSS compliant luxury checkout.</span>
          </div>
        </div>

      </div>

      {/* Fullscreen Payment Processing Modal */}
      {paymentLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center font-sans text-white text-center p-6 animate-fadeIn">
          <div className="space-y-4 max-w-sm bg-neutral-900/90 border border-neutral-700 p-8 rounded-3xl shadow-2xl">
            <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-serif text-lg font-bold tracking-wider text-luxury-gold uppercase">
              Authorizing Transaction
            </h3>
            <p className="text-xs font-light text-neutral-300 transition-all duration-300">
              {paymentMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
