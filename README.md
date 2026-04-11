# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

### ✅ Running development Build
To ensure the app correctly connects to the local development server when using a physical device:
1. **Network Connectivity**: Ensure both the PC and the phone are on the same network.
   - Recommended: Hotspot your phone and connect the PC to that hotspot.
2. **Physical Connection**: Connect your phone to the PC via a USB cable.
2b. **Enable USB Debugging**: Enable USB debugging on your Android device.
3. **Port Forwarding**: Run the following command to route the traffic correctly:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
4. **Start the app**:
   ```bash
   npx expo start --dev-client
   ```
5. **Using in an emulator/simulator like Nox Player, Bluestack etc**:
   ```bash
   ipconfig
   ```
   - Make sure you are using the ip address of your PC
     `[IP_ADDRESS]:[PORT]`
      11.222.89.56:8081

### ✅ Bundling .apk and .abb
````bash
eas build --platform android --profile development
eas build --platform all --profile development
eas build --platform ios --profile development
```


You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
