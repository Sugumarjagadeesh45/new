// In /Users/webasebrandings/Downloads/new_far-main 2/src/Screen1/Shopping/AddressContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { getBackendUrl } from '../../../src/util/backendConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

interface AddressContextType {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  fetchAddresses: () => Promise<void>;
}

export const AddressContext = createContext<AddressContextType>({
  addresses: [],
  defaultAddress: null,
  addAddress: () => {},
  updateAddress: () => {},
  deleteAddress: () => {},
  setDefaultAddress: () => {},
  fetchAddresses: async () => {},
});

export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;

  useEffect(() => {
    // Get user ID from AsyncStorage
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
          fetchAddresses(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  const fetchAddresses = async (uid?: string) => {
    try {
      setLoading(true);
      const currentUserId = uid || userId;
      
      if (!currentUserId) {
        // If no user ID, use default address
        const defaultAddresses: Address[] = [
          {
            id: '1',
            name: 'Rahul Sharma',
            phone: '+91 9876543210',
            addressLine1: '123 Main Street',
            addressLine2: 'Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India',
            isDefault: true,
            latitude: 19.0760,
            longitude: 72.8777,
          },
        ];
        setAddresses(defaultAddresses);
        return;
      }
      
      // Fetch addresses from backend
      const response = await axios.get(`${getBackendUrl()}/api/users/addresses`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Fallback to default address
      const defaultAddresses: Address[] = [
        {
          id: '1',
          name: 'Rahul Sharma',
          phone: '+91 9876543210',
          addressLine1: '123 Main Street',
          addressLine2: 'Apartment 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          isDefault: true,
          latitude: 19.0760,
          longitude: 72.8777,
        },
      ];
      setAddresses(defaultAddresses);
      Alert.alert('Error', 'Failed to fetch addresses. Using default address.');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (newAddress: Omit<Address, 'id'>) => {
    try {
      const address: Address = {
        ...newAddress,
        id: Date.now().toString(),
      };
      
      if (userId) {
        // Save to backend
        const response = await axios.post(
          `${getBackendUrl()}/api/users/addresses`,
          address,
          {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          setAddresses(prev => [...prev, response.data.data]);
        }
      } else {
        // Save locally
        setAddresses(prev => [...prev, address]);
      }
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const updateAddress = async (id: string, updatedAddress: Partial<Address>) => {
    try {
      if (userId) {
        // Update on backend
        const response = await axios.put(
          `${getBackendUrl()}/api/users/addresses/${id}`,
          updatedAddress,
          {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.success) {
          setAddresses(prev => 
            prev.map(addr => 
              addr.id === id ? { ...addr, ...response.data.data } : addr
            )
          );
        }
      } else {
        // Update locally
        setAddresses(prev => 
          prev.map(addr => 
            addr.id === id ? { ...addr, ...updatedAddress } : addr
          )
        );
      }
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', 'Failed to update address');
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      if (addresses.length <= 1) {
        Alert.alert('Error', 'You must have at least one address');
        return;
      }
      
      if (userId) {
        // Delete from backend
        await axios.delete(
          `${getBackendUrl()}/api/users/addresses/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            }
          }
        );
        
        setAddresses(prev => prev.filter(addr => addr.id !== id));
      } else {
        // Delete locally
        setAddresses(prev => prev.filter(addr => addr.id !== id));
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      Alert.alert('Error', 'Failed to delete address');
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      if (userId) {
        // Update on backend
        await axios.patch(
          `${getBackendUrl()}/api/users/addresses/${id}/set-default`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
            }
          }
        );
        
        setAddresses(prev =>
          prev.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
          }))
        );
      } else {
        // Update locally
        setAddresses(prev =>
          prev.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
          }))
        );
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  return (
    <AddressContext.Provider value={{
      addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      fetchAddresses,
    }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);



// // /Users/webasebrandings/Downloads/new_far-main 2/src/Screen1/Shopping/AddressContext.tsx
// import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// import { Alert } from 'react-native';
// import axios from 'axios';
// import { getBackendUrl } from '../../../src/util/backendConfig';

// interface Address {
//   id: string;
//   _id?: string;
//   name: string;
//   phone: string;
//   addressLine1: string;
//   addressLine2?: string;
//   city: string;
//   state: string;
//   pincode: string;
//   country: string;
//   isDefault: boolean;
//   latitude?: number;
//   longitude?: number;
// }

// interface AddressContextType {
//   addresses: Address[];
//   defaultAddress: Address | null;
//   addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
//   updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
//   deleteAddress: (id: string) => Promise<void>;
//   setDefaultAddress: (id: string) => Promise<void>;
//   fetchAddresses: () => Promise<void>;
//   loading: boolean;
// }

// export const AddressContext = createContext<AddressContextType>({
//   addresses: [],
//   defaultAddress: null,
//   addAddress: async () => {},
//   updateAddress: async () => {},
//   deleteAddress: async () => {},
//   setDefaultAddress: async () => {},
//   fetchAddresses: async () => {},
//   loading: false,
// });

// export const AddressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [addresses, setAddresses] = useState<Address[]>([]);
//   const [loading, setLoading] = useState(false);

//   const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;

//   const fetchAddresses = async () => {
//     if (!user || !token) {
//       console.log('❌ No user or token available for fetching addresses');
//       return;
//     }

//     try {
//       setLoading(true);
//       const BASE_URL = getBackendUrl();
      
//       const response = await axios.get(`${BASE_URL}/api/users/address`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         const fetchedAddresses = response.data.data.map((addr: any) => ({
//           id: addr._id,
//           ...addr
//         }));
//         setAddresses(fetchedAddresses);
//         console.log('✅ Addresses fetched successfully:', fetchedAddresses.length);
//       }
//     } catch (error) {
//       console.error('❌ Error fetching addresses:', error);
//       // Fallback to local storage if API fails
//       const savedAddresses = await getAddressesFromStorage();
//       setAddresses(savedAddresses);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addAddress = async (newAddress: Omit<Address, 'id'>) => {
//     try {
//       setLoading(true);
//       const BASE_URL = getBackendUrl();
      
//       const response = await axios.post(`${BASE_URL}/api/users/address`, newAddress, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         const savedAddress = {
//           id: response.data.data._id,
//           ...response.data.data
//         };
        
//         setAddresses(prev => [...prev, savedAddress]);
//         await saveAddressesToStorage([...addresses, savedAddress]);
        
//         Alert.alert('Success', 'Address added successfully');
//       }
//     } catch (error) {
//       console.error('❌ Error adding address:', error);
      
//       // Fallback: Save locally
//       const localAddress: Address = {
//         ...newAddress,
//         id: Date.now().toString(),
//       };
      
//       setAddresses(prev => [...prev, localAddress]);
//       await saveAddressesToStorage([...addresses, localAddress]);
      
//       Alert.alert('Success', 'Address added locally');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateAddress = async (id: string, updatedAddress: Partial<Address>) => {
//     try {
//       setLoading(true);
//       const BASE_URL = getBackendUrl();
      
//       const response = await axios.put(`${BASE_URL}/api/users/address/${id}`, updatedAddress, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         setAddresses(prev => 
//           prev.map(addr => 
//             addr.id === id ? { ...addr, ...updatedAddress } : addr
//           )
//         );
//         await saveAddressesToStorage(addresses.map(addr => 
//           addr.id === id ? { ...addr, ...updatedAddress } : addr
//         ));
        
//         Alert.alert('Success', 'Address updated successfully');
//       }
//     } catch (error) {
//       console.error('❌ Error updating address:', error);
//       Alert.alert('Error', 'Failed to update address');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteAddress = async (id: string) => {
//     try {
//       if (addresses.length <= 1) {
//         Alert.alert('Error', 'You must have at least one address');
//         return;
//       }

//       setLoading(true);
//       const BASE_URL = getBackendUrl();
      
//       const response = await axios.delete(`${BASE_URL}/api/users/address/${id}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         setAddresses(prev => prev.filter(addr => addr.id !== id));
//         await saveAddressesToStorage(addresses.filter(addr => addr.id !== id));
        
//         Alert.alert('Success', 'Address deleted successfully');
//       }
//     } catch (error) {
//       console.error('❌ Error deleting address:', error);
//       Alert.alert('Error', 'Failed to delete address');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const setDefaultAddress = async (id: string) => {
//     try {
//       setLoading(true);
//       const BASE_URL = getBackendUrl();
      
//       const response = await axios.patch(`${BASE_URL}/api/users/address/${id}/set-default`, {}, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         setAddresses(prev =>
//           prev.map(addr => ({
//             ...addr,
//             isDefault: addr.id === id,
//           }))
//         );
//         await saveAddressesToStorage(addresses.map(addr => ({
//           ...addr,
//           isDefault: addr.id === id,
//         })));
        
//         Alert.alert('Success', 'Default address set successfully');
//       }
//     } catch (error) {
//       console.error('❌ Error setting default address:', error);
//       Alert.alert('Error', 'Failed to set default address');
//     } finally {
//       setLoading(false);
//     }
//   };



//   // Local storage helpers (fallback)
//   const saveAddressesToStorage = async (addresses: Address[]) => {
//     try {
//       // Using AsyncStorage or similar
//       // await AsyncStorage.setItem('userAddresses', JSON.stringify(addresses));
//     } catch (error) {
//       console.error('Error saving addresses to storage:', error);
//     }
//   };

//   const getAddressesFromStorage = async (): Promise<Address[]> => {
//     try {
//       // const saved = await AsyncStorage.getItem('userAddresses');
//       // return saved ? JSON.parse(saved) : [];
//       return [];
//     } catch (error) {
//       console.error('Error getting addresses from storage:', error);
//       return [];
//     }
//   };

//   return (
//     <AddressContext.Provider value={{
//       addresses,
//       defaultAddress,
//       addAddress,
//       updateAddress,
//       deleteAddress,
//       setDefaultAddress,
//       fetchAddresses,
//       loading,
//     }}>
//       {children}
//     </AddressContext.Provider>
//   );
// };

// export const useAddress = () => useContext(AddressContext);