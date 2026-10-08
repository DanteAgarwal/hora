export interface CityOption {
  name: string
  label: string
  stateOrCountry: string
  lat: number
  lon: number
  tz: string
  region?: string
}

export const CITIES_DATABASE: CityOption[] = [
  // --- Uttar Pradesh: Braj & West UP (Agra, Hathras, Aligarh region) ---
  { name: 'Agra', label: 'Agra, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Hathras', label: 'Hathras, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.5968, lon: 78.0519, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Aligarh', label: 'Aligarh, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.8974, lon: 78.0880, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Mathura', label: 'Mathura (Braj Mandal), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.4924, lon: 77.6737, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Vrindavan', label: 'Vrindavan, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.5806, lon: 77.7006, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Firozabad', label: 'Firozabad, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.1594, lon: 78.3957, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Etah', label: 'Etah, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.5583, lon: 78.6657, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Kasganj', label: 'Kasganj, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.8083, lon: 78.6477, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Mainpuri', label: 'Mainpuri, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.2272, lon: 79.0253, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Etawah', label: 'Etawah, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 26.7855, lon: 79.0154, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Sadabad', label: 'Sadabad (Hathras), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.4419, lon: 78.0416, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Sasni', label: 'Sasni (Hathras), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.7078, lon: 78.0805, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Iglas', label: 'Iglas (Aligarh), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.7144, lon: 77.9351, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Khair', label: 'Khair (Aligarh), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.9472, lon: 77.8389, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Atrauli', label: 'Atrauli (Aligarh), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.0319, lon: 78.2917, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Shikohabad', label: 'Shikohabad (Firozabad), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.1084, lon: 78.5842, tz: 'Asia/Kolkata', region: 'UP / Braj' },
  { name: 'Fatehpur Sikri', label: 'Fatehpur Sikri (Agra), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 27.0911, lon: 77.6611, tz: 'Asia/Kolkata', region: 'UP / Braj' },

  // --- Delhi NCR & West UP ---
  { name: 'New Delhi', label: 'New Delhi, Delhi NCR', stateOrCountry: 'Delhi NCR', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Noida', label: 'Noida, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Greater Noida', label: 'Greater Noida, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.4744, lon: 77.5040, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Ghaziabad', label: 'Ghaziabad, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Gurugram', label: 'Gurugram (Gurgaon), Haryana', stateOrCountry: 'Haryana', lat: 28.4595, lon: 77.0266, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Faridabad', label: 'Faridabad, Haryana', stateOrCountry: 'Haryana', lat: 28.4089, lon: 77.3178, tz: 'Asia/Kolkata', region: 'Delhi NCR' },
  { name: 'Meerut', label: 'Meerut, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Bulandshahr', label: 'Bulandshahr, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.4069, lon: 77.8498, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Moradabad', label: 'Moradabad, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.8386, lon: 78.7733, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Bareilly', label: 'Bareilly, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Saharanpur', label: 'Saharanpur, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 29.9675, lon: 77.5450, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Muzaffarnagar', label: 'Muzaffarnagar, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 29.4727, lon: 77.7085, tz: 'Asia/Kolkata', region: 'UP' },

  // --- Central & Eastern Uttar Pradesh ---
  { name: 'Lucknow', label: 'Lucknow (Capital), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Kanpur', label: 'Kanpur, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Ayodhya', label: 'Ayodhya (Sri Ram Janmabhoomi), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 26.7922, lon: 82.1998, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Varanasi', label: 'Varanasi (Kashi / Banaras), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Prayagraj', label: 'Prayagraj (Allahabad / Sangam), Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Gorakhpur', label: 'Gorakhpur, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 26.7606, lon: 83.3732, tz: 'Asia/Kolkata', region: 'UP' },
  { name: 'Jhansi', label: 'Jhansi, Uttar Pradesh', stateOrCountry: 'Uttar Pradesh', lat: 25.4484, lon: 78.5685, tz: 'Asia/Kolkata', region: 'UP' },

  // --- Rajasthan (Neighbors to Agra & West UP) ---
  { name: 'Bharatpur', label: 'Bharatpur, Rajasthan', stateOrCountry: 'Rajasthan', lat: 27.2152, lon: 77.5030, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Dholpur', label: 'Dholpur, Rajasthan', stateOrCountry: 'Rajasthan', lat: 26.7025, lon: 77.8934, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Jaipur', label: 'Jaipur (Pink City), Rajasthan', stateOrCountry: 'Rajasthan', lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Kota', label: 'Kota, Rajasthan', stateOrCountry: 'Rajasthan', lat: 25.2138, lon: 75.8648, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Jodhpur', label: 'Jodhpur, Rajasthan', stateOrCountry: 'Rajasthan', lat: 26.2389, lon: 73.0243, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Udaipur', label: 'Udaipur, Rajasthan', stateOrCountry: 'Rajasthan', lat: 24.5854, lon: 73.7125, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Ajmer', label: 'Ajmer / Pushkar, Rajasthan', stateOrCountry: 'Rajasthan', lat: 26.4499, lon: 74.6399, tz: 'Asia/Kolkata', region: 'Rajasthan' },
  { name: 'Bikaner', label: 'Bikaner, Rajasthan', stateOrCountry: 'Rajasthan', lat: 28.0229, lon: 73.3119, tz: 'Asia/Kolkata', region: 'Rajasthan' },

  // --- Madhya Pradesh (Neighbors to Agra & Bundelkhand) ---
  { name: 'Gwalior', label: 'Gwalior, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Morena', label: 'Morena, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 26.4999, lon: 77.9947, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Bhind', label: 'Bhind, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 26.5654, lon: 78.7884, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Bhopal', label: 'Bhopal, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Indore', label: 'Indore, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Ujjain', label: 'Ujjain (Mahakaleshwar), Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },
  { name: 'Jabalpur', label: 'Jabalpur, Madhya Pradesh', stateOrCountry: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864, tz: 'Asia/Kolkata', region: 'Madhya Pradesh' },

  // --- Major Indian Metros & Western India ---
  { name: 'Mumbai', label: 'Mumbai, Maharashtra', stateOrCountry: 'Maharashtra', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata', region: 'Maharashtra' },
  { name: 'Pune', label: 'Pune, Maharashtra', stateOrCountry: 'Maharashtra', lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata', region: 'Maharashtra' },
  { name: 'Nagpur', label: 'Nagpur, Maharashtra', stateOrCountry: 'Maharashtra', lat: 21.1458, lon: 79.0882, tz: 'Asia/Kolkata', region: 'Maharashtra' },
  { name: 'Nashik', label: 'Nashik (Trimbakeshwar), Maharashtra', stateOrCountry: 'Maharashtra', lat: 19.9975, lon: 73.7898, tz: 'Asia/Kolkata', region: 'Maharashtra' },
  { name: 'Ahmedabad', label: 'Ahmedabad, Gujarat', stateOrCountry: 'Gujarat', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata', region: 'Gujarat' },
  { name: 'Surat', label: 'Surat, Gujarat', stateOrCountry: 'Gujarat', lat: 21.1702, lon: 72.8311, tz: 'Asia/Kolkata', region: 'Gujarat' },
  { name: 'Vadodara', label: 'Vadodara, Gujarat', stateOrCountry: 'Gujarat', lat: 22.3072, lon: 73.1812, tz: 'Asia/Kolkata', region: 'Gujarat' },
  { name: 'Dwarka', label: 'Dwarka (Dwarakadheesh), Gujarat', stateOrCountry: 'Gujarat', lat: 22.2442, lon: 68.9685, tz: 'Asia/Kolkata', region: 'Gujarat' },

  // --- South India ---
  { name: 'Bengaluru', label: 'Bengaluru (Bangalore), Karnataka', stateOrCountry: 'Karnataka', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Hyderabad', label: 'Hyderabad, Telangana', stateOrCountry: 'Telangana', lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Chennai', label: 'Chennai (Madras), Tamil Nadu', stateOrCountry: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Coimbatore', label: 'Coimbatore, Tamil Nadu', stateOrCountry: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Madurai', label: 'Madurai (Meenakshi), Tamil Nadu', stateOrCountry: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Rameswaram', label: 'Rameswaram, Tamil Nadu', stateOrCountry: 'Tamil Nadu', lat: 9.2876, lon: 79.3129, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Tirupati', label: 'Tirupati (Balaji), Andhra Pradesh', stateOrCountry: 'Andhra Pradesh', lat: 13.6288, lon: 79.4192, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Visakhapatnam', label: 'Visakhapatnam (Vizag), Andhra Pradesh', stateOrCountry: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Vijayawada', label: 'Vijayawada, Andhra Pradesh', stateOrCountry: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Guntur', label: 'Guntur, Andhra Pradesh', stateOrCountry: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Kochi', label: 'Kochi (Cochin), Kerala', stateOrCountry: 'Kerala', lat: 9.9312, lon: 76.2673, tz: 'Asia/Kolkata', region: 'South' },
  { name: 'Thiruvananthapuram', label: 'Thiruvananthapuram (Trivandrum), Kerala', stateOrCountry: 'Kerala', lat: 8.5241, lon: 76.9366, tz: 'Asia/Kolkata', region: 'South' },

  // --- East & North East India ---
  { name: 'Kolkata', label: 'Kolkata (Calcutta), West Bengal', stateOrCountry: 'West Bengal', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata', region: 'East' },
  { name: 'Patna', label: 'Patna, Bihar', stateOrCountry: 'Bihar', lat: 25.5941, lon: 85.1376, tz: 'Asia/Kolkata', region: 'Bihar' },
  { name: 'Gaya', label: 'Gaya (Bodh Gaya), Bihar', stateOrCountry: 'Bihar', lat: 24.7914, lon: 85.0002, tz: 'Asia/Kolkata', region: 'Bihar' },
  { name: 'Ranchi', label: 'Ranchi, Jharkhand', stateOrCountry: 'Jharkhand', lat: 23.3441, lon: 85.3096, tz: 'Asia/Kolkata', region: 'East' },
  { name: 'Bhubaneswar', label: 'Bhubaneswar, Odisha', stateOrCountry: 'Odisha', lat: 20.2961, lon: 85.8245, tz: 'Asia/Kolkata', region: 'East' },
  { name: 'Puri', label: 'Puri (Jagannath Dham), Odisha', stateOrCountry: 'Odisha', lat: 19.8135, lon: 85.8312, tz: 'Asia/Kolkata', region: 'East' },
  { name: 'Guwahati', label: 'Guwahati (Kamakhya), Assam', stateOrCountry: 'Assam', lat: 26.1445, lon: 91.7362, tz: 'Asia/Kolkata', region: 'North East' },

  // --- North India & Himalayas ---
  { name: 'Chandigarh', label: 'Chandigarh (Capital), Punjab & Haryana', stateOrCountry: 'Punjab / Haryana', lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Amritsar', label: 'Amritsar (Golden Temple), Punjab', stateOrCountry: 'Punjab', lat: 31.6340, lon: 74.8723, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Ludhiana', label: 'Ludhiana, Punjab', stateOrCountry: 'Punjab', lat: 30.9010, lon: 75.8573, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Haridwar', label: 'Haridwar (Ganga Ghat), Uttarakhand', stateOrCountry: 'Uttarakhand', lat: 29.9457, lon: 78.1642, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Rishikesh', label: 'Rishikesh, Uttarakhand', stateOrCountry: 'Uttarakhand', lat: 30.0869, lon: 78.2676, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Dehradun', label: 'Dehradun, Uttarakhand', stateOrCountry: 'Uttarakhand', lat: 30.3165, lon: 78.0322, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Shimla', label: 'Shimla, Himachal Pradesh', stateOrCountry: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Srinagar', label: 'Srinagar, Jammu & Kashmir', stateOrCountry: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973, tz: 'Asia/Kolkata', region: 'North' },
  { name: 'Jammu', label: 'Jammu, Jammu & Kashmir', stateOrCountry: 'Jammu & Kashmir', lat: 32.7266, lon: 74.8570, tz: 'Asia/Kolkata', region: 'North' },

  // --- Neighboring & International Locations ---
  { name: 'Kathmandu', label: 'Kathmandu (Pashupatinath), Nepal', stateOrCountry: 'Nepal', lat: 27.7172, lon: 85.3240, tz: 'Asia/Kathmandu', region: 'International' },
  { name: 'Dubai', label: 'Dubai, United Arab Emirates', stateOrCountry: 'UAE', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', region: 'International' },
  { name: 'London', label: 'London, United Kingdom', stateOrCountry: 'UK', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', region: 'International' },
  { name: 'New York', label: 'New York, USA', stateOrCountry: 'USA', lat: 40.7128, lon: -74.0060, tz: 'America/New_York', region: 'International' },
  { name: 'San Francisco', label: 'San Francisco (Silicon Valley), USA', stateOrCountry: 'USA', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles', region: 'International' },
  { name: 'Toronto', label: 'Toronto, Canada', stateOrCountry: 'Canada', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', region: 'International' },
  { name: 'Singapore', label: 'Singapore', stateOrCountry: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore', region: 'International' },
  { name: 'Sydney', label: 'Sydney, Australia', stateOrCountry: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', region: 'International' },
  { name: 'Tokyo', label: 'Tokyo, Japan', stateOrCountry: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', region: 'International' },
]

export const POPULAR_QUICK_CITIES: string[] = [
  'Agra',
  'Hathras',
  'Aligarh',
  'Mathura',
  'New Delhi',
  'Lucknow',
  'Varanasi',
  'Mumbai',
  'Bengaluru',
]
