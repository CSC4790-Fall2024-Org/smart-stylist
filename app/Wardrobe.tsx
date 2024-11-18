import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, RefreshControl, Button, TouchableOpacity } from 'react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from './configuration';
import { addDoc, collection } from 'firebase/firestore'; 
import { db } from './configuration'; 

const Wardrobe = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const storageRef = ref(storage, 'clothing/');
      const result = await listAll(storageRef);
  
      const urls = await Promise.all(
        result.items.map(itemRef => getDownloadURL(itemRef))
      );
  
      setImageUrls(urls);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const toggleImageSelection = (uri: string) => {
    setSelectedImages(prevSelected =>
      prevSelected.includes(uri)
        ? prevSelected.filter(image => image !== uri)
        : [...prevSelected, uri]
    );
  };

  const handleSaveOutfit = async () => {
    if (selectedImages.length === 0) {
      alert('Please select images for the outfit');
      return;
    }

    const outfitData = {
      userId: 'guest', 
      images: selectedImages,
    };

    try {
      const outfitsRef = collection(db, 'outfits');
      await addDoc(outfitsRef, outfitData);
      alert('Outfit saved successfully!');
      setSelectedImages([]); 
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Failed to save outfit. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading images...</Text>
      ) : (
        <FlatList
          data={imageUrls}
          keyExtractor={(url, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleImageSelection(item)}
              style={[
                styles.imageContainer,
                selectedImages.includes(item) && styles.selectedImageContainer,
              ]}
            >
              <View style={{ margin: 5 }}>
              <Image source={{ uri: item }} style={styles.image} />
             </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          numColumns={2}
        />
      )}
      <Button title="Save Outfit" onPress={handleSaveOutfit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#cceeff',
  },
  imageContainer: {
    marginBottom: 10,
    marginHorizontal: 5,
  },
  selectedImageContainer: {
    borderWidth: 2,
    borderColor: 'blue',
    borderRadius: 10,
  },
  image: {
    width: 160,  
    height: 200,    
    marginBottom: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    resizeMode: 'cover', 
  },
});

export default Wardrobe;


