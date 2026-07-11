// Run with: node seed.js
// Populates real Patna restaurants (via Google Places data) + menu items +
// one delivery partner so the frontend has something authentic to show.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');

async function seed() {
  await connectDB();

  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});
  await User.deleteMany({ role: 'delivery_partner' });
  await User.deleteMany({ role: 'restaurant_owner' });

  const owner = await User.create({
    name: 'Demo Owner',
    email: 'owner@demo.com',
    password: 'hashed-placeholder',
    phone: '9999999999',
    role: 'restaurant_owner',
  });

  const restaurantData = [
    {
      name: 'Vrihi Skydeck',
      cuisine: ['Rooftop', 'Fine Dining', 'North Indian'],
      address: { street: 'Atal Path, Mahesh Nagar', city: 'Patna', lat: 25.6222, lng: 85.1057 },
      rating: 4.5,
      ratingCount: 1570,
      priceRangeForTwo: 1400,
    },
    {
      name: 'Amritsar Haveli Patna',
      cuisine: ['Punjabi', 'North Indian'],
      address: { street: 'Gayatri Mandir Rd, Kankarbagh', city: 'Patna', lat: 25.5992, lng: 85.1546 },
      rating: 4.7,
      ratingCount: 1695,
      priceRangeForTwo: 700,
    },
    {
      name: 'Foresto Paradise',
      cuisine: ['Family Restaurant', 'Barbecue', 'Fine Dining'],
      address: { street: 'Patna One Plaza, Fraser Road', city: 'Patna', lat: 25.6099, lng: 85.1370 },
      rating: 4.2,
      ratingCount: 12068,
      priceRangeForTwo: 900,
    },
    {
      name: 'The Glass Box',
      cuisine: ['Cafe', 'Fine Dining', 'Continental'],
      address: { street: 'Panch Shiv Mandir Rd, Kankarbagh', city: 'Patna', lat: 25.5994, lng: 85.1481 },
      rating: 4.4,
      ratingCount: 2546,
      priceRangeForTwo: 1000,
    },
    {
      name: 'The Picante',
      cuisine: ['Mexican', 'Continental'],
      address: { street: 'Anisabad More', city: 'Patna', lat: 25.5790, lng: 85.0984 },
      rating: 4.5,
      ratingCount: 1024,
      priceRangeForTwo: 600,
    },
    {
      name: 'Cafe Hideout',
      cuisine: ['Cafe', 'Continental', 'Burgers'],
      address: { street: 'Gayatri Mandir Rd, Kankarbagh', city: 'Patna', lat: 25.5996, lng: 85.1550 },
      rating: 4.7,
      ratingCount: 4055,
      priceRangeForTwo: 650,
    },
    {
      name: 'Hello Restaurant & Cafe',
      cuisine: ['North Indian', 'Cafe', 'Pocket Friendly'],
      address: { street: 'Boring Rd, Sri Krishna Nagar', city: 'Patna', lat: 25.6195, lng: 85.1227 },
      rating: 4.8,
      ratingCount: 4939,
      priceRangeForTwo: 600,
    },
    {
      name: 'Pind Balluchi',
      cuisine: ['North Indian', 'Family Restaurant'],
      address: { street: 'Saguna More, Kaliket Nagar', city: 'Patna', lat: 25.6188, lng: 85.0420 },
      rating: 4.6,
      ratingCount: 1442,
      priceRangeForTwo: 850,
    },
    {
      name: 'Unplugged Dineout',
      cuisine: ['North Indian', 'Cafe', 'Rooftop'],
      address: { street: 'Congress Maidan Rd', city: 'Patna', lat: 25.6093, lng: 85.1521 },
      rating: 4.4,
      ratingCount: 377,
      priceRangeForTwo: 700,
    },
    {
      name: 'La Casa Cafe',
      cuisine: ['North Indian', 'Continental', 'Cafe'],
      address: { street: 'Boring Patliputra Rd', city: 'Patna', lat: 25.6219, lng: 85.1084 },
      rating: 4.3,
      ratingCount: 953,
      priceRangeForTwo: 650,
    },
  ];

  const restaurants = await Restaurant.insertMany(
    restaurantData.map((r) => ({
      owner: owner._id,
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      rating: r.rating,
      ratingCount: r.ratingCount,
      avgDeliveryTimeMins: 25 + Math.floor(Math.random() * 20), // 25-44 min, varied
      priceRangeForTwo: r.priceRangeForTwo,
    }))
  );

  const byName = (name) => restaurants.find((r) => r.name === name)._id;

  await MenuItem.insertMany([
    // Vrihi Skydeck
    { restaurant: byName('Vrihi Skydeck'), name: 'Paneer Tikka', price: 320, category: 'Starters', isVeg: true, description: 'Char-grilled cottage cheese with smoky spices' },
    { restaurant: byName('Vrihi Skydeck'), name: 'Tandoori Chicken', price: 420, category: 'Starters', isVeg: false, description: 'Classic tandoor-roasted chicken' },
    { restaurant: byName('Vrihi Skydeck'), name: 'Gulab Jamun', price: 120, category: 'Desserts', isVeg: true, description: 'Soft milk dumplings in sugar syrup' },

    // Amritsar Haveli Patna
    { restaurant: byName('Amritsar Haveli Patna'), name: 'Butter Chicken', price: 380, category: 'Main Course', isVeg: false, description: 'Rich tomato and butter based curry' },
    { restaurant: byName('Amritsar Haveli Patna'), name: 'Dal Makhani', price: 260, category: 'Main Course', isVeg: true, description: 'Slow-cooked black lentils in butter and cream' },
    { restaurant: byName('Amritsar Haveli Patna'), name: 'Butter Naan', price: 60, category: 'Breads', isVeg: true, description: 'Soft tandoor bread brushed with butter' },

    // Foresto Paradise
    { restaurant: byName('Foresto Paradise'), name: 'Chicken Biryani', price: 340, category: 'Main Course', isVeg: false, description: 'Fragrant basmati rice with spiced chicken' },
    { restaurant: byName('Foresto Paradise'), name: 'Veg Biryani', price: 280, category: 'Main Course', isVeg: true, description: 'Aromatic rice with mixed vegetables and spices' },
    { restaurant: byName('Foresto Paradise'), name: 'Seekh Kebab', price: 300, category: 'Starters', isVeg: false, description: 'Grilled minced meat skewers' },

    // The Glass Box
    { restaurant: byName('The Glass Box'), name: 'Pasta Alfredo', price: 340, category: 'Main Course', isVeg: true, description: 'Creamy white sauce pasta' },
    { restaurant: byName('The Glass Box'), name: 'Chicken Sizzler', price: 420, category: 'Main Course', isVeg: false, description: 'Grilled chicken served sizzling with veggies' },

    // The Picante
    { restaurant: byName('The Picante'), name: 'Cheesy Nachos', price: 260, category: 'Starters', isVeg: true, description: 'Crispy nachos loaded with cheese and salsa' },
    { restaurant: byName('The Picante'), name: 'Chicken Burrito', price: 300, category: 'Main Course', isVeg: false, description: 'Rolled tortilla with spiced chicken and rice' },

    // Cafe Hideout
    { restaurant: byName('Cafe Hideout'), name: 'Classic Cheese Burger', price: 220, category: 'Burgers', isVeg: false, description: 'Juicy patty with melted cheese' },
    { restaurant: byName('Cafe Hideout'), name: 'Veg Loaded Sandwich', price: 180, category: 'Sandwiches', isVeg: true, description: 'Grilled sandwich with fresh vegetables and cheese' },

    // Hello Restaurant & Cafe
    { restaurant: byName('Hello Restaurant & Cafe'), name: 'Paneer Butter Masala', price: 240, category: 'Main Course', isVeg: true, description: 'Rich tomato-based curry with cottage cheese' },
    { restaurant: byName('Hello Restaurant & Cafe'), name: 'Egg Fried Rice', price: 190, category: 'Main Course', isVeg: false, description: 'Wok-tossed rice with egg and vegetables' },

    // Pind Balluchi
    { restaurant: byName('Pind Balluchi'), name: 'Matka Kulfi', price: 140, category: 'Desserts', isVeg: true, description: 'Traditional clay-pot set kulfi' },
    { restaurant: byName('Pind Balluchi'), name: 'Paneer Hara Bhara', price: 280, category: 'Main Course', isVeg: true, description: 'Cottage cheese in a green spinach gravy' },

    // Unplugged Dineout
    { restaurant: byName('Unplugged Dineout'), name: 'Rooftop Special Thali', price: 350, category: 'Main Course', isVeg: true, description: 'Assorted North Indian dishes served together' },
    { restaurant: byName('Unplugged Dineout'), name: 'Chicken Tikka', price: 320, category: 'Starters', isVeg: false, description: 'Marinated and char-grilled chicken chunks' },

    // La Casa Cafe
    { restaurant: byName('La Casa Cafe'), name: 'La Casa Special Kebab', price: 310, category: 'Starters', isVeg: false, description: 'House special spiced kebabs' },
    { restaurant: byName('La Casa Cafe'), name: 'Margherita Pizza', price: 260, category: 'Main Course', isVeg: true, description: 'Classic cheese and tomato pizza' },
  ]);

  await User.create({
    name: 'Ravi Kumar',
    email: 'ravi.delivery@demo.com',
    password: 'hashed-placeholder',
    phone: '8888888888',
    role: 'delivery_partner',
    deliveryPartnerStatus: 'available',
    currentLocation: { lat: 25.61, lng: 85.13 },
  });

  // Fixed-ID demo customer so the frontend can place test orders without
  // building real auth/signup yet. The ID matches what the frontend's
  // Checkout page sends as customerId.
  await User.deleteOne({ _id: '000000000000000000000001' });
  await User.create({
    _id: '000000000000000000000001',
    name: 'Demo Customer',
    email: 'demo.customer@demo.com',
    password: 'hashed-placeholder',
    phone: '7777777777',
    role: 'customer',
  });

  console.log(`Seed complete: ${restaurants.length} Patna restaurants, menu items, 1 delivery partner, 1 demo customer`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
