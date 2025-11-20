// In /Users/webasebrandings/Downloads/new_far-main 2/src/Screen1/Shopping/AddressManagement.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, PermissionsAndroid, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAddress } from './AddressContext';
import Geolocation from '@react-native-community/geolocation';

const AddressManagement = () => {
  const navigation = useNavigation();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, fetchAddresses } = useAddress();
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    // Fetch addresses when component mounts
    fetchAddresses().finally(() => setLoading(false));
  }, []);

  const handleSaveAddress = () => {
    // Basic validation
    if (!formData.name || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return;
    }

    // Validate pincode
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    if (editingAddress) {
      updateAddress(editingAddress.id, formData);
      Alert.alert('Success', 'Address updated successfully');
    } else {
      addAddress({ ...formData, isDefault: addresses.length === 0 });
      Alert.alert('Success', 'Address added successfully');
    }
    
    setEditingAddress(null);
    setIsEditing(false);
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    });
  };

  const startEdit = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsEditing(true);
  };

  const handleDelete = (address) => {
    if (addresses.length <= 1) {
      Alert.alert('Error', 'You must have at least one address');
      return;
    }
    
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAddress(address.id)
        },
      ]
    );
  };

  const fetchCurrentLocation = () => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();
      } else {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Access Required',
              message: 'This app needs to access your location to fetch your current address',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getLocation();
          } else {
            Alert.alert('Permission Denied', 'Location permission denied');
          }
        } catch (err) {
          console.warn(err);
          Alert.alert('Error', 'Failed to request location permission');
        }
      }
    };

    const getLocation = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Use a geocoding service to get address from coordinates
          // Using OpenCage Geocoding API
          fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`)
            .then(response => response.json())
            .then(data => {
              if (data.results && data.results.length > 0) {
                const address = data.results[0].components;
                setFormData({
                  ...formData,
                  addressLine1: `${address.road || ''} ${address.house_number || ''}`,
                  city: address.city || address.town || address.village || '',
                  state: address.state || '',
                  pincode: address.postcode || '',
                });
              }
            })
            .catch(error => {
              console.error('Error fetching address:', error);
              Alert.alert('Error', 'Failed to fetch address from location');
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Failed to get current location');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    requestLocationPermission();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        {!isEditing && (
          <TouchableOpacity 
            onPress={() => {
              setIsEditing(true);
              setEditingAddress(null);
              setFormData({
                name: '',
                phone: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India',
              });
            }}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color="#4caf50" />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
          
          <TouchableOpacity style={styles.locationButton} onPress={fetchCurrentLocation}>
            <MaterialIcons name="my-location" size={24} color="#4caf50" />
            <Text style={styles.locationButtonText}>Fetch My Current Location</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
            maxLength={10}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Address Line 1 *"
            value={formData.addressLine1}
            onChangeText={(text) => setFormData({...formData, addressLine1: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Address Line 2 (Optional)"
            value={formData.addressLine2}
            onChangeText={(text) => setFormData({...formData, addressLine2: text})}
          />
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City *"
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State *"
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Pincode *"
            value={formData.pincode}
            onChangeText={(text) => setFormData({...formData, pincode: text})}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={formData.country}
            onChangeText={(text) => setFormData({...formData, country: text})}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
            <Text style={styles.saveButtonText}>
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => {
              setIsEditing(false);
              setEditingAddress(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.addressesList}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{address.name}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressText}>{address.addressLine1}</Text>
              {address.addressLine2 && (
                <Text style={styles.addressText}>{address.addressLine2}</Text>
              )}
              <Text style={styles.addressText}>
                {address.city}, {address.state} - {address.pincode}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>
              
              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setDefaultAddress(address.id)}
                  >
                    <Text style={styles.actionButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => startEdit(address)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                {addresses.length > 1 && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(address)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {addresses.length === 0 && (
            <View style={styles.noAddressContainer}>
              <MaterialIcons name="location-on" size={60} color="#ddd" />
              <Text style={styles.noAddressText}>No addresses saved</Text>
              <Text style={styles.noAddressSubtext}>
                Add your first address to get started with deliveries
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  addressesList: {
    flex: 1,
    padding: 20,
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#e53935',
  },
  noAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noAddressText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noAddressSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddressManagement;



// // /Users/webasebrandings/Downloads/new_far-main 2/src/Screen1/Shopping/AddressManagement.tsx
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, PermissionsAndroid, Platform } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { useNavigation } from '@react-navigation/native';
// import { useAddress } from './AddressContext';
// import Geolocation from '@react-native-community/geolocation';
// import axios from 'axios';

// const AddressManagement = () => {
//   const navigation = useNavigation();
//   const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, fetchAddresses, loading } = useAddress();
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingAddress, setEditingAddress] = useState<any>(null);
//   const [locationLoading, setLocationLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     addressLine1: '',
//     addressLine2: '',
//     city: '',
//     state: '',
//     pincode: '',
//     country: 'India',
//     latitude: null as number | null,
//     longitude: null as number | null,
//   });

//   useEffect(() => {
//     fetchAddresses();
//   }, []);

//   const handleSaveAddress = async () => {
//     // Basic validation
//     if (!formData.name || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
//       Alert.alert('Error', 'Please fill all required fields');
//       return;
//     }

//     // Validate phone number
//     const phoneRegex = /^[6-9]\d{9}$/;
//     if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
//       Alert.alert('Error', 'Please enter a valid Indian phone number');
//       return;
//     }

//     // Validate pincode
//     const pincodeRegex = /^\d{6}$/;
//     if (!pincodeRegex.test(formData.pincode)) {
//       Alert.alert('Error', 'Please enter a valid 6-digit pincode');
//       return;
//     }

//     try {
//       if (editingAddress) {
//         await updateAddress(editingAddress.id, {
//           ...formData,
//           isDefault: editingAddress.isDefault
//         });
//       } else {
//         await addAddress({
//           ...formData,
//           isDefault: addresses.length === 0
//         });
//       }
      
//       setEditingAddress(null);
//       setIsEditing(false);
//       resetForm();
      
//     } catch (error) {
//       console.error('Error saving address:', error);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       phone: '',
//       addressLine1: '',
//       addressLine2: '',
//       city: '',
//       state: '',
//       pincode: '',
//       country: 'India',
//       latitude: null,
//       longitude: null,
//     });
//   };

//   const startEdit = (address: any) => {
//     setEditingAddress(address);
//     setFormData({
//       name: address.name,
//       phone: address.phone,
//       addressLine1: address.addressLine1,
//       addressLine2: address.addressLine2 || '',
//       city: address.city,
//       state: address.state,
//       pincode: address.pincode,
//       country: address.country,
//       latitude: address.latitude || null,
//       longitude: address.longitude || null,
//     });
//     setIsEditing(true);
//   };

//   const handleDelete = async (address: any) => {
//     if (addresses.length <= 1) {
//       Alert.alert('Error', 'You must have at least one address');
//       return;
//     }
    
//     Alert.alert(
//       'Delete Address',
//       'Are you sure you want to delete this address?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: () => deleteAddress(address.id)
//         },
//       ]
//     );
//   };

//   const fetchCurrentLocation = async () => {
//     setLocationLoading(true);
    
//     try {
//       // Request location permission
//       if (Platform.OS === 'android') {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location to fetch your current address.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
        
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           Alert.alert('Permission Denied', 'Location permission is required to fetch your current location.');
//           setLocationLoading(false);
//           return;
//         }
//       }

//       // Get current position
//       Geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
//           console.log('📍 Current location:', latitude, longitude);
          
//           try {
//             // Use OpenCage Geocoding API to get address from coordinates
//             const response = await axios.get(
//               `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY&language=en&countrycode=in`
//             );
            
//             if (response.data.results && response.data.results.length > 0) {
//               const address = response.data.results[0].components;
              
//               setFormData(prev => ({
//                 ...prev,
//                 addressLine1: `${address.road || ''} ${address.house_number || ''}`.trim(),
//                 city: address.city || address.town || address.village || address.county || '',
//                 state: address.state || '',
//                 pincode: address.postcode || '',
//                 country: address.country || 'India',
//                 latitude: latitude,
//                 longitude: longitude
//               }));
              
//               Alert.alert('Success', 'Location fetched successfully!');
//             } else {
//               Alert.alert('Error', 'Could not fetch address from location');
//             }
//           } catch (geocodeError) {
//             console.error('Geocoding error:', geocodeError);
//             Alert.alert('Error', 'Failed to fetch address from location');
//           } finally {
//             setLocationLoading(false);
//           }
//         },
//         (error) => {
//           console.error('Location error:', error);
//           Alert.alert('Error', 'Failed to get current location');
//           setLocationLoading(false);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 10000
//         }
//       );
      
//     } catch (error) {
//       console.error('Location permission error:', error);
//       Alert.alert('Error', 'Failed to request location permission');
//       setLocationLoading(false);
//     }
//   };

//   if (loading && addresses.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.loadingText}>Loading addresses...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <MaterialIcons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Manage Addresses</Text>
//         {!isEditing && (
//           <TouchableOpacity 
//             onPress={() => {
//               setIsEditing(true);
//               setEditingAddress(null);
//               resetForm();
//             }}
//             style={styles.addButton}
//           >
//             <MaterialIcons name="add" size={24} color="#4caf50" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {isEditing ? (
//         <ScrollView style={styles.formContainer}>
//           <Text style={styles.formTitle}>{editingAddress ? 'Edit Address' : 'Add New Address'}</Text>
          
//           <TouchableOpacity 
//             style={[styles.locationButton, locationLoading && styles.disabledButton]} 
//             onPress={fetchCurrentLocation}
//             disabled={locationLoading}
//           >
//             <MaterialIcons name="my-location" size={24} color="#4caf50" />
//             <Text style={styles.locationButtonText}>
//               {locationLoading ? 'Fetching Location...' : 'Fetch My Current Location'}
//             </Text>
//           </TouchableOpacity>
          
//           <TextInput
//             style={styles.input}
//             placeholder="Full Name *"
//             value={formData.name}
//             onChangeText={(text) => setFormData({...formData, name: text})}
//             placeholderTextColor="#999"
//           />
          
//           <TextInput
//             style={styles.input}
//             placeholder="Phone Number *"
//             value={formData.phone}
//             onChangeText={(text) => setFormData({...formData, phone: text})}
//             keyboardType="phone-pad"
//             maxLength={10}
//             placeholderTextColor="#999"
//           />
          
//           <TextInput
//             style={styles.input}
//             placeholder="Address Line 1 *"
//             value={formData.addressLine1}
//             onChangeText={(text) => setFormData({...formData, addressLine1: text})}
//             placeholderTextColor="#999"
//           />
          
//           <TextInput
//             style={styles.input}
//             placeholder="Address Line 2 (Optional)"
//             value={formData.addressLine2}
//             onChangeText={(text) => setFormData({...formData, addressLine2: text})}
//             placeholderTextColor="#999"
//           />
          
//           <View style={styles.row}>
//             <TextInput
//               style={[styles.input, styles.halfInput]}
//               placeholder="City *"
//               value={formData.city}
//               onChangeText={(text) => setFormData({...formData, city: text})}
//               placeholderTextColor="#999"
//             />
//             <TextInput
//               style={[styles.input, styles.halfInput]}
//               placeholder="State *"
//               value={formData.state}
//               onChangeText={(text) => setFormData({...formData, state: text})}
//               placeholderTextColor="#999"
//             />
//           </View>
          
//           <TextInput
//             style={styles.input}
//             placeholder="Pincode *"
//             value={formData.pincode}
//             onChangeText={(text) => setFormData({...formData, pincode: text})}
//             keyboardType="number-pad"
//             maxLength={6}
//             placeholderTextColor="#999"
//           />
          
//           <TextInput
//             style={styles.input}
//             placeholder="Country"
//             value={formData.country}
//             onChangeText={(text) => setFormData({...formData, country: text})}
//             placeholderTextColor="#999"
//           />
          
//           <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
//             <Text style={styles.saveButtonText}>
//               {editingAddress ? 'Update Address' : 'Save Address'}
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.cancelButton} 
//             onPress={() => {
//               setIsEditing(false);
//               setEditingAddress(null);
//               resetForm();
//             }}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </ScrollView>
//       ) : (
//         <ScrollView style={styles.addressesList}>
//           {addresses.map((address) => (
//             <View key={address.id} style={styles.addressCard}>
//               <View style={styles.addressHeader}>
//                 <Text style={styles.addressName}>{address.name}</Text>
//                 {address.isDefault && (
//                   <View style={styles.defaultBadge}>
//                     <Text style={styles.defaultBadgeText}>Default</Text>
//                   </View>
//                 )}
//               </View>
//               <Text style={styles.addressPhone}>{address.phone}</Text>
//               <Text style={styles.addressText}>{address.addressLine1}</Text>
//               {address.addressLine2 && (
//                 <Text style={styles.addressText}>{address.addressLine2}</Text>
//               )}
//               <Text style={styles.addressText}>
//                 {address.city}, {address.state} - {address.pincode}
//               </Text>
//               <Text style={styles.addressText}>{address.country}</Text>
              
//               <View style={styles.addressActions}>
//                 {!address.isDefault && (
//                   <TouchableOpacity 
//                     style={styles.actionButton}
//                     onPress={() => setDefaultAddress(address.id)}
//                   >
//                     <Text style={styles.actionButtonText}>Set as Default</Text>
//                   </TouchableOpacity>
//                 )}
//                 <TouchableOpacity 
//                   style={styles.actionButton}
//                   onPress={() => startEdit(address)}
//                 >
//                   <Text style={styles.actionButtonText}>Edit</Text>
//                 </TouchableOpacity>
//                 {addresses.length > 1 && (
//                   <TouchableOpacity 
//                     style={[styles.actionButton, styles.deleteButton]}
//                     onPress={() => handleDelete(address)}
//                   >
//                     <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </View>
//           ))}
          
//           {addresses.length === 0 && (
//             <View style={styles.noAddressContainer}>
//               <MaterialIcons name="location-on" size={60} color="#ddd" />
//               <Text style={styles.noAddressText}>No addresses saved</Text>
//               <Text style={styles.noAddressSubtext}>
//                 Add your first address to get started with deliveries
//               </Text>
//               <TouchableOpacity 
//                 style={styles.addFirstAddressButton}
//                 onPress={() => setIsEditing(true)}
//               >
//                 <Text style={styles.addFirstAddressText}>Add Your First Address</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </ScrollView>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   backButton: {
//     padding: 5,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   addButton: {
//     padding: 5,
//   },
//   formContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   formTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   locationButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f8e9',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   locationButtonText: {
//     marginLeft: 10,
//     fontSize: 16,
//     color: '#4caf50',
//     fontWeight: '500',
//   },
//   input: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 15,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     color: '#333',
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   halfInput: {
//     width: '48%',
//   },
//   saveButton: {
//     backgroundColor: '#4caf50',
//     borderRadius: 8,
//     padding: 15,
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   cancelButton: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     padding: 15,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#666',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   addressesList: {
//     flex: 1,
//     padding: 20,
//   },
//   addressCard: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   addressHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   addressName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   defaultBadge: {
//     backgroundColor: '#4caf50',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   defaultBadgeText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   addressPhone: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 5,
//   },
//   addressText: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   addressActions: {
//     flexDirection: 'row',
//     marginTop: 10,
//     flexWrap: 'wrap',
//   },
//   actionButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//     backgroundColor: '#e3f2fd',
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   actionButtonText: {
//     color: '#2196f3',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   deleteButton: {
//     backgroundColor: '#ffebee',
//   },
//   deleteButtonText: {
//     color: '#e53935',
//   },
//   noAddressContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//   },
//   noAddressText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 20,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   noAddressSubtext: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 30,
//   },
//   addFirstAddressButton: {
//     backgroundColor: '#4caf50',
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//   },
//   addFirstAddressText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default AddressManagement;