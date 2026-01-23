// frontend/app/(screens)/classroomScreen.tsx

import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import ChatsTab from '@/components/ChatsTab'
import TasksTab from '@/components/TasksTab'
import Header from '@/components/MessagingHeader';
import { selectSelectedClassroom } from '@/store/slices/classroom/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';
import TabBar from '@/components/TabBar';
import { RootState } from '@/store/store';
import { setSelectedClassroom } from '@/store/slices/classroom/classroomSlice';
import AttachmentSheet from '@/components/AttachmentSheet';
import CallOptionsSheet from '@/components/CallOptionsSheet';
import MenuSheet from '@/components/MenuSheet';


type ClassroomTab = 'chats' | 'announcements' | 'assignments' | 'tasks';

const ClassroomScreen = () => {


  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassroomTab>('chats');

  const classroomId = useLocalSearchParams<{ chat_id: string }>().chat_id;

  const classroom = useSelector(
    (state: RootState) => state.classroom.classrooms[classroomId]
  );

  // const handleTabChange = (tab: 'Chats' | 'Announcements' | 'Assignments' | 'Tasks') => {
  //   setActiveTab(tab);
  // };

  const handleAttachmentSelect = (type: string) => {
    console.log('Selected attachment type:', type);
    setIsAttachmentSheetVisible(false);
  };

  const handleCallOptionSelect = (option: string) => {
    console.log('Selected call option:', option);
    setIsCallSheetVisible(false);
  };

  const handleMenuItemSelect = (item: string) => {
    console.log('Selected menu item:', item);
    setIsMenuSheetVisible(false);
  };



  if (!classroom) {
    return (
      <View>
        <Text>Classroom not found.</Text>
      </View>
    )
  }

  const headerTitle = useMemo(() => {

    return classroom ? classroom.title : 'Base';
  }, [classroom]);

  return (
    <View>
      <View style={styles.headerContainer}>
        <Header
          title={headerTitle}
          subtitle=''
          showBackButton={true}
          showSearch={true}
          showCall={true}
          showMenu={true}
          onBackPress={() => router.back()}
          onCallPress={() => setIsCallSheetVisible(true)}
          onMenuPress={() => setIsMenuSheetVisible(true)}
        // isDarkMode={isDarkMode}
        />

        {/* <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
        /> */}

        <AttachmentSheet
        visible={isAttachmentSheetVisible}
        onClose={() => setIsAttachmentSheetVisible(false)}
        onSelect={handleAttachmentSelect}
        isDarkMode={isDarkMode}
      />

      <CallOptionsSheet
        visible={isCallSheetVisible}
        onClose={() => setIsCallSheetVisible(false)}
        onSelect={handleCallOptionSelect}
        isDarkMode={isDarkMode}
      />

      <MenuSheet
        visible={isMenuSheetVisible}
        onClose={() => setIsMenuSheetVisible(false)}
        onSelect={handleMenuItemSelect}
        isDarkMode={isDarkMode}
      />


      </View>
    </View>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {},
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ClassroomScreen