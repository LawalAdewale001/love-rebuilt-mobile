import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  HStack,
  Text,
  VStack,
  ScrollView,
  Divider,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const DROPDOWN_OPTIONS = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'family', label: 'Family' },
  { value: 'other', label: 'Other' },
];

// Date options for bottom-sheet date selection (no native datetimepicker dependency)
function getDateOptions(): { date: Date; label: string }[] {
  const options: { date: Date; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ date: d, label });
  }
  return options;
}

const DATE_OPTIONS = getDateOptions();

export default function HomeScreen() {
  const router = useRouter();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  const openModal = () => router.push('/modal');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPickedImage(result.assets[0].uri);
  };

  const selectOption = (value: string, label: string) => {
    setSelectedOption(label);
    setDropdownOpen(false);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setDateSheetOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView flex={1} bg="$background">
        <VStack flex={1} px="$4" pt="$6" pb="$8" space="xl">
          {/* Header */}
          <Box>
            <Heading size="2xl" color="$textLight900">
              Welcome back
            </Heading>
            <Text size="md" color="$textLight600" mt="$1">
              Here’s what’s happening today.
            </Text>
          </Box>

          <Divider bg="$borderLight200" />

          {/* Quick actions card */}
          <Card p="$4" bg="$white" borderRadius="$lg" softShadow="1">
            <VStack space="sm">
              <Text size="sm" fontWeight="$semibold" color="$textLight700">
                Quick actions
              </Text>
              <HStack space="md" flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="$full"
                  onPress={() => setBottomSheetOpen(true)}
                >
                  <ButtonText>Bottom sheet</ButtonText>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="$full"
                  onPress={openModal}
                >
                  <ButtonText>Open modal</ButtonText>
                </Button>
                <Button
                  size="sm"
                  bg="$primary500"
                  borderRadius="$full"
                  onPress={openModal}
                >
                  <ButtonText>Get started</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </Card>

          {/* Date, image & dropdown components */}
          <VStack space="md">
            <Text size="lg" fontWeight="$semibold" color="$textLight800">
              Components
            </Text>

            {/* Date selection (bottom sheet) */}
            <Card p="$4" bg="$white" borderRadius="$lg">
              <Text size="sm" fontWeight="$semibold" color="$textLight700" mb="$2">
                Date
              </Text>
              <Pressable onPress={() => setDateSheetOpen(true)}>
                <Input size="md" borderWidth="$1" borderRadius="$md" borderColor="$borderLight300">
                  <InputField
                    value={selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    placeholder="Select date"
                    editable={false}
                    pointerEvents="none"
                  />
                </Input>
              </Pressable>
            </Card>

            {/* Date selection bottom sheet */}
            <Actionsheet
              isOpen={dateSheetOpen}
              onClose={() => setDateSheetOpen(false)}
              snapPoints={[50]}
            >
              <ActionsheetBackdrop />
              <ActionsheetContent bg="$white" borderTopLeftRadius="$2xl" borderTopRightRadius="$2xl">
                <ActionsheetDragIndicatorWrapper>
                  <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>
                <VStack px="$4" pb="$6" pt="$2" space="sm">
                  <Text size="lg" fontWeight="$semibold" color="$textLight900">
                    Choose date
                  </Text>
                  {DATE_OPTIONS.map((opt) => (
                    <ActionsheetItem key={opt.label} onPress={() => selectDate(opt.date)}>
                      <ActionsheetItemText color="$textLight900">{opt.label}</ActionsheetItemText>
                    </ActionsheetItem>
                  ))}
                </VStack>
              </ActionsheetContent>
            </Actionsheet>

            {/* Image picker */}
            <Card p="$4" bg="$white" borderRadius="$lg">
              <Text size="sm" fontWeight="$semibold" color="$textLight700" mb="$2">
                Image
              </Text>
              <Button size="sm" variant="outline" onPress={pickImage}>
                <ButtonText>Pick image</ButtonText>
              </Button>
              {pickedImage && (
                <Box mt="$3" w="$24" h="$24" borderRadius="$lg" overflow="hidden" bg="$gray100">
                  <Image source={{ uri: pickedImage }} style={{ width: '100%', height: '100%' }} />
                </Box>
              )}
            </Card>

            {/* Custom dropdown (opens in bottom sheet) */}
            <Card p="$4" bg="$white" borderRadius="$lg">
              <Text size="sm" fontWeight="$semibold" color="$textLight700" mb="$2">
                Category (dropdown in sheet)
              </Text>
              <Pressable onPress={() => setDropdownOpen(true)}>
                <Input size="md" borderWidth="$1" borderRadius="$md" borderColor="$borderLight300">
                  <InputField
                    value={selectedOption ?? 'Select category'}
                    placeholder="Select category"
                    editable={false}
                    pointerEvents="none"
                    color={selectedOption ? '$textLight900' : '$textLight500'}
                  />
                </Input>
              </Pressable>
            </Card>
          </VStack>

          {/* Dropdown bottom sheet */}
          <Actionsheet
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            snapPoints={[50]}
          >
            <ActionsheetBackdrop />
            <ActionsheetContent bg="$white" borderTopLeftRadius="$2xl" borderTopRightRadius="$2xl">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              <VStack px="$4" pb="$6" pt="$2" space="sm">
                <Text size="lg" fontWeight="$semibold" color="$textLight900">
                  Choose category
                </Text>
                {DROPDOWN_OPTIONS.map((opt) => (
                  <ActionsheetItem
                    key={opt.value}
                    onPress={() => selectOption(opt.value, opt.label)}
                  >
                    <ActionsheetItemText color="$textLight900">{opt.label}</ActionsheetItemText>
                  </ActionsheetItem>
                ))}
              </VStack>
            </ActionsheetContent>
          </Actionsheet>

          {/* Quick actions bottom sheet — snapPoints are percentages 0–100 */}
          <Actionsheet
            isOpen={bottomSheetOpen}
            onClose={() => setBottomSheetOpen(false)}
            snapPoints={[40, 70]}
          >
            <ActionsheetBackdrop />
            <ActionsheetContent bg="$white" borderTopLeftRadius="$2xl" borderTopRightRadius="$2xl">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              <VStack px="$4" pb="$6" pt="$2" space="md">
                <Text size="lg" fontWeight="$semibold" color="$textLight900">
                  Choose an option
                </Text>
                <ActionsheetItem onPress={() => setBottomSheetOpen(false)}>
                  <ActionsheetItemText color="$textLight900">Share</ActionsheetItemText>
                </ActionsheetItem>
                <ActionsheetItem onPress={() => setBottomSheetOpen(false)}>
                  <ActionsheetItemText color="$textLight900">Save</ActionsheetItemText>
                </ActionsheetItem>
                <ActionsheetItem onPress={() => setBottomSheetOpen(false)}>
                  <ActionsheetItemText color="$textLight900">Copy link</ActionsheetItemText>
                </ActionsheetItem>
                <ActionsheetItem onPress={() => setBottomSheetOpen(false)}>
                  <ActionsheetItemText color="$textLight900">Cancel</ActionsheetItemText>
                </ActionsheetItem>
              </VStack>
            </ActionsheetContent>
          </Actionsheet>

          {/* Feature list */}
          <VStack space="md">
            <Text size="lg" fontWeight="$semibold" color="$textLight800">
              Getting started
            </Text>
            <VStack space="sm">
              <Card p="$3" bg="$backgroundLight50" borderRadius="$md">
                <HStack alignItems="center" space="md">
                  <Box w="$10" h="$10" bg="$primary500" borderRadius="$full" />
                  <VStack flex={1} space="xs">
                    <Text size="sm" fontWeight="$semibold">
                      Edit this screen
                    </Text>
                    <Text size="xs" color="$textLight600">
                      Change app/(tabs)/index.tsx to customize the home screen.
                    </Text>
                  </VStack>
                </HStack>
              </Card>
              <Card p="$3" bg="$backgroundLight50" borderRadius="$md">
                <HStack alignItems="center" space="md">
                  <Box w="$10" h="$10" bg="$secondary500" borderRadius="$full" />
                  <VStack flex={1} space="xs">
                    <Text size="sm" fontWeight="$semibold">
                      Explore tab
                    </Text>
                    <Text size="xs" color="$textLight600">
                      Switch to the Explore tab to see more of the starter.
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            </VStack>
          </VStack>

          {/* Primary CTA */}
          <Box pt="$2">
            <Button
              size="lg"
              bg="$primary600"
              borderRadius="$lg"
              onPress={openModal}
            >
              <ButtonText>Explore modal</ButtonText>
            </Button>
          </Box>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
