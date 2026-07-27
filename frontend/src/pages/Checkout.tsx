import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, CreditCard, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutAPI } from '../services/api';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, pricing, coupon, clearCart } = useCart();

  const [step, setStep] = useState(1); // 1: Address, 2: Slot/Shipping, 3: Review & Payment
  
  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false
  });

  // Shipping & Slot details
  const [shippingMethod, setShippingMethod] = useState('Standard'); // 'Standard' | 'Express'
  const [deliverySlot, setDeliverySlot] = useState('');
  const [slotsList, setSlotsList] = useState<string[]>([]);

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'UPI' | 'NET_BANKING' | 'COD'
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiVpa, setUpiVpa] = useState('');
  const [netBankBranch, setNetBankBranch] = useState('SBI');
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
  }, [user]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const data = await checkoutAPI.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const def = data.find((a: any) => a.isDefault);
        setSelectedAddressId(def ? def.id : data[0].id);
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
    
    // Generate next 3 days time-slots
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await checkoutAPI.addAddress(newAddress);
      setAddresses([...addresses, addr]);
      setSelectedAddressId(addr.id);
      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
    } catch (err) {
      alert('Failed to add address, please check fields.');
    }
  };

  const executeOrderCheckout = async () => {
    setPaymentLoading(true);
    setPaymentMessage('Verifying inventory & reserving items...');
    
    // Step through funny loader
    setTimeout(() => {
      setPaymentMessage('Contacting secure bank payment gateway...');
    }, 800);

    setTimeout(async () => {
      try {
        const orderPayload = {
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: coupon?.code || null,
          items: cartItems.map(item => ({
            productId: item.productId,
            title: item.product.title,
            brand: item.product.brand,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: Math.round(item.product.price * (1 - item.product.discount / 100)),
            image: item.product.images[0]
          })),
          summary: {
            subtotal: pricing.subtotal,
            discount: pricing.productDiscount + pricing.couponDiscount,
            tax: pricing.tax,
            shipping: pricing.shipping + (shippingMethod === 'Express' ? 99 : 0),
            total: pricing.total + (shippingMethod === 'Express' ? 99 : 0)
          }
        };

        const result = await checkoutAPI.createOrder(orderPayload);
        
        setPaymentMessage('Payment Approved! Finalizing order invoice...');
        
        setTimeout(() => {
          clearCart();
          setPaymentLoading(false);
          navigate(`/order-confirmation?orderId=${result.order.id}`);
        }, 1000);

      } catch (err: any) {
        setPaymentLoading(false);
        alert(err.response?.data?.message || 'Payment authentication failed. Please try another card.');
      }
    }, 1800);
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const totalWithShipping = pricing.total + (shippingMethod === 'Express' ? 99 : 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      {/* Page Header */}
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark border-b border-neutral-100 pb-4 uppercase tracking-wide">
        Secure Checkout
      </h1>

      {/* Checkout Container */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Multi Step Wizard */}
        <div className="w-full lg:w-[65%] space-y-6">
          
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white">
              <h3 className="font-serif text-base font-bold text-luxury-dark flex items-center gap-2">
                <span className="w-5.5 h-5.5 bg-luxury-dark text-white rounded-full flex items-center justify-center text-xs">1</span>
                Delivery Address
              </h3>
              {step > 1 && (
                <button onClick={() => setStep(1)} className="text-[10px] font-bold text-luxury-gold uppercase tracking-wider">
                  Edit
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="p-5 space-y-6">
                {addressLoading ? (
                  <p className="text-xs text-luxury-muted">Loading your addresses...</p>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-luxury-muted mb-4 font-sans font-light">No saved addresses found. Please add a shipping address to proceed.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Shipping Address
                    </button>
                  </div>
                ) : !showAddressForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected ? 'border-luxury-dark bg-[#FAF9F6]' : 'border-neutral-200 hover:border-luxury-gold bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-xs text-luxury-dark">{addr.name}</p>
                              {addr.isDefault && (
                                <span className="bg-luxury-gold/10 text-luxury-gold text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-luxury-muted mt-2 leading-relaxed font-light font-sans">
                              {addr.street},<br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-xs text-luxury-dark mt-2 font-medium">Ph: {addr.phone}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-[10px] font-bold text-luxury-gold flex items-center gap-1 hover:text-luxury-dark transition-colors uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Address
                      </button>
                      
                      <button
                        onClick={() => setStep(2)}
                        disabled={!selectedAddressId}
                        className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:bg-zinc-200"
                      >
                        Deliver Here <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Add Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="space-y-1">
                      <label className="font-bold text-luxury-muted">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-luxury-muted">10-Digit Mobile Number</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-luxury-muted">Street / Locality address</label>
                      <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-luxury-muted">City</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-luxury-muted">State</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-luxury-muted">Pincode (6 Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="default_addr"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                        className="accent-luxury-gold"
                      />
                      <label htmlFor="default_addr" className="font-semibold text-luxury-dark cursor-pointer">Set as default shipping profile</label>
                    </div>
                    <div className="md:col-span-2 flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2.5 rounded-lg uppercase tracking-wider text-[10px] transition-colors"
                      >
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2.5 rounded-lg uppercase tracking-wider bg-white text-[10px] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {step > 1 && selectedAddress && (
              <div className="px-6 py-3 border-t border-neutral-100 text-xs text-luxury-muted leading-relaxed font-light font-sans">
                <strong>{selectedAddress.name}</strong>, {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </div>
            )}
          </div>

          {/* STEP 2: SHIPPING METHOD & TIMESLOT */}
          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white">
              <h3 className="font-serif text-base font-bold text-luxury-dark flex items-center gap-2">
                <span className="w-5.5 h-5.5 bg-luxury-dark text-white rounded-full flex items-center justify-center text-xs">2</span>
                Shipping & Delivery Schedule
              </h3>
              {step > 2 && (
                <button onClick={() => setStep(2)} className="text-[10px] font-bold text-luxury-gold uppercase tracking-wider">
                  Edit
                </button>
              )}
            </div>

            {step === 2 && (
              <div className="p-5 space-y-6">
                {/* Method selector */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark font-sans">Select Delivery Speed</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Standard */}
                    <div
                      onClick={() => setShippingMethod('Standard')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        shippingMethod === 'Standard' ? 'border-luxury-dark bg-[#FAF9F6]' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-neutral-450" />
                        <div>
                          <p className="font-bold text-xs text-luxury-dark">Standard Delivery</p>
                          <p className="text-[10px] text-luxury-muted font-light font-sans">Delivery in 3-4 working days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-600">FREE</span>
                    </div>

                    {/* Express */}
                    <div
                      onClick={() => setShippingMethod('Express')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        shippingMethod === 'Express' ? 'border-luxury-dark bg-[#FAF9F6]' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-luxury-gold" />
                        <div>
                          <p className="font-bold text-xs text-luxury-dark">Express Delivery</p>
                          <p className="text-[10px] text-luxury-muted font-light font-sans">Priority shipment in 1-2 metro days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-luxury-dark">Rs. 99</span>
                    </div>
                  </div>
                </div>

                {/* Slot Selector */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark font-sans">Select Delivery Time Slot</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {slotsList.map((slot) => (
                      <div
                        key={slot}
                        onClick={() => setDeliverySlot(slot)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                          deliverySlot === slot ? 'border-luxury-dark bg-[#FAF9F6]' : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          deliverySlot === slot ? 'border-luxury-dark bg-luxury-dark text-white' : 'border-zinc-300'
                        }`}>
                          {deliverySlot === slot && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <span className="font-semibold text-neutral-700">{slot}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-[10px] font-bold text-luxury-muted flex items-center gap-1 hover:text-luxury-dark transition-colors uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    Review & Pay <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {step > 2 && (
              <div className="px-6 py-3 border-t border-neutral-100 text-xs text-luxury-muted font-light flex justify-between font-sans">
                <span>Speed: <strong className="text-luxury-dark font-semibold">{shippingMethod}</strong></span>
                <span>Slot: <strong className="text-luxury-dark font-semibold">{deliverySlot}</strong></span>
              </div>
            )}
          </div>

          {/* STEP 3: ORDER REVIEW & SECURE PAYMENT */}
          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white">
              <h3 className="font-serif text-base font-bold text-luxury-dark flex items-center gap-2">
                <span className="w-5.5 h-5.5 bg-luxury-dark text-white rounded-full flex items-center justify-center text-xs">3</span>
                Review Order & Secure Payment
              </h3>
            </div>

            {step === 3 && (
              <div className="p-5 space-y-6">
                
                {/* Cart mini review */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark font-sans">Review items in Bag</h4>
                  <div className="border border-neutral-100 rounded-lg overflow-hidden divide-y divide-neutral-100">
                    {cartItems.map((item, idx) => {
                      const discPrice = Math.round(item.product.price * (1 - item.product.discount / 100));
                      return (
                        <div key={idx} className="flex gap-4 p-3 bg-[#FAF9F6]">
                          <div className="w-12 h-16 bg-luxury-cream rounded overflow-hidden shrink-0 border border-neutral-100">
                            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover object-top" />
                          </div>
                          <div className="flex-1 flex justify-between items-center text-xs font-sans">
                            <div>
                              <h4 className="font-semibold text-luxury-dark text-[11px] leading-tight line-clamp-1">{item.product.title}</h4>
                              <p className="text-[10px] text-luxury-muted mt-0.5">Size: {item.size} | Color: {item.color}</p>
                              <p className="text-[9px] font-semibold text-luxury-gold uppercase tracking-wider mt-0.5">{item.product.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs. {discPrice * item.quantity}</p>
                              <p className="text-[10px] text-luxury-muted">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secure payments interface */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-4 h-4 text-green-600" /> Select Payment Method
                  </h4>

                  <div className="flex flex-col md:flex-row gap-0 border border-neutral-100 rounded-lg overflow-hidden bg-[#FAF9F6]">
                    
                    {/* Method List */}
                    <div className="w-full md:w-[35%] border-r border-neutral-100 divide-y divide-neutral-100 bg-white text-xs">
                      {[
                        { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                        { id: 'UPI', label: 'UPI (GPay, PhonePe)', icon: CreditCard },
                        { id: 'NET_BANKING', label: 'Net Banking', icon: CreditCard },
                        { id: 'COD', label: 'Cash On Delivery', icon: CreditCard }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={`w-full text-left p-3.5 font-semibold transition-colors flex items-center gap-2.5 ${
                            paymentMethod === m.id ? 'bg-[#FAF9F6] text-luxury-gold' : 'hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Method details panel */}
                    <div className="w-full md:w-[65%] p-5 text-xs">
                      {paymentMethod === 'CARD' && (
                        <div className="space-y-3">
                          <h5 className="font-bold text-luxury-dark">Enter Card Credentials</h5>
                          <div className="space-y-2">
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="16-Digit Card Number"
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                              className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                            />
                            <input
                              type="text"
                              placeholder="Name on Card"
                              value={cardDetails.name}
                              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                              className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                className="w-1/2 bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                              />
                              <input
                                type="password"
                                maxLength={3}
                                placeholder="CVV"
                                value={cardDetails.cvv}
                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                className="w-1/2 bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-luxury-muted font-light leading-relaxed font-sans">
                            Simulated test gateway: Any dummy details are accepted.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'UPI' && (
                        <div className="space-y-3">
                          <h5 className="font-bold text-luxury-dark">Scan QR or enter VPA</h5>
                          <input
                            type="text"
                            placeholder="username@upi"
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                          />
                          <p className="text-[10px] text-luxury-muted font-light leading-relaxed font-sans">
                            A simulation prompt will appear to verify payment approval.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'NET_BANKING' && (
                        <div className="space-y-3">
                          <h5 className="font-bold text-luxury-dark">Select banking Institution</h5>
                          <select
                            value={netBankBranch}
                            onChange={(e) => setNetBankBranch(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                          >
                            <option value="SBI">State Bank of India</option>
                            <option value="HDFC">HDFC Bank</option>
                            <option value="ICICI">ICICI Bank</option>
                            <option value="AXIS">Axis Bank</option>
                          </select>
                        </div>
                      )}

                      {paymentMethod === 'COD' && (
                        <div className="space-y-2">
                          <h5 className="font-bold text-luxury-dark">Cash on Delivery details</h5>
                          <p className="text-xs text-luxury-muted leading-relaxed font-light font-sans">
                            Pay in cash or using UPI scanner at the time of doorstep parcel delivery. Free convenience.
                          </p>
                        </div>
                      )}

                    </div>

                  </div>
                </div>

                {/* Back button and Place Order */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="text-[10px] font-bold text-luxury-muted flex items-center gap-1 hover:text-luxury-dark transition-colors uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <button
                    onClick={executeOrderCheckout}
                    className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition-colors"
                  >
                    Pay & Confirm Order (Rs. {totalWithShipping})
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Order Price Summary Card */}
        <div className="w-full lg:w-[35%] bg-white border border-neutral-100 rounded-xl p-6 space-y-5 font-sans sticky top-24 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-luxury-dark border-b border-neutral-100 pb-3">Price Summary</h3>
          
          <div className="space-y-2 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Bag Subtotal</span>
              <span>Rs. {pricing.subtotal}</span>
            </div>
            {pricing.productDiscount > 0 && (
              <div className="flex justify-between text-luxury-accent">
                <span>Product Discounts</span>
                <span>- Rs. {pricing.productDiscount}</span>
              </div>
            )}
            {pricing.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({coupon?.code})</span>
                <span>- Rs. {pricing.couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST / Taxes (12%)</span>
              <span>Rs. {pricing.tax}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>{pricing.shipping === 0 ? 'FREE' : `Rs. ${pricing.shipping}`}</span>
            </div>
            {shippingMethod === 'Express' && (
              <div className="flex justify-between text-luxury-gold">
                <span>Express upgrade fee</span>
                <span>Rs. 99</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-luxury-dark border-t border-neutral-100 pt-3">
              <span>Estimated Total</span>
              <span>Rs. {totalWithShipping}</span>
            </div>
          </div>

          {/* Secure indicator */}
          <div className="flex items-center gap-2 text-[10px] text-luxury-muted font-light pt-2 leading-relaxed">
            <ShieldCheck className="w-4.5 h-4.5 text-green-650 shrink-0" />
            <span>Secure 256-bit SSL encrypted transaction with PCI DSS compliance.</span>
          </div>
        </div>

      </div>

      {/* Payment Loading Modal */}
      {paymentLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center font-sans text-white text-center p-6">
          <div className="space-y-4 max-w-sm">
            {/* Spinning Gold Indicator */}
            <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-serif text-xl font-semibold tracking-wider text-luxury-gold">Authorizing Transaction</h3>
            <p className="text-xs font-light text-zinc-300 transition-all duration-300">
              {paymentMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
export default Checkout;
