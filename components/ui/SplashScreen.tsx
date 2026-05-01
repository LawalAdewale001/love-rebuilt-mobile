import React from "react";
import { Image, StatusBar, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        transparent
        backgroundColor="transparent"
      />
      <Image
        source={require("@/assets/images/bg-image.png")}
        style={styles.bgImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E86A7A",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
});
