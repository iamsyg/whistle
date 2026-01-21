// // // frontend/services/auth/signInWithGoogle.ts

import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin'
import { router } from 'expo-router';
import { Alert } from 'react-native';

export type GoogleEmailResult = {
  email: string;
  email_verified: boolean;
};

export async function signOutGoogle() {
    try {
        await GoogleSignin.signOut();
        console.log('User signed out from Google and Supabase successfully');

        router.replace('/(tabs)/Base');
    } catch (error) {
        console.error('Error signing out from Google:', error);
    }
}

// export const checkUserGoogleAuth = async () => {
//     try {
//         const userInfo = await GoogleSignin.signInSilently();

//         if(userInfo && userInfo.data?.user) {
//             console.log('User is already signed in:', userInfo.data.user);
//             router.replace('/(tabs)/Chats');
//         } else {
//             console.log('No user is signed in');
//         }
//     } catch (error) {
//         console.error('Error checking signed-in user:', error);
//     }
// }

export async function signInWithGoogle():Promise<GoogleEmailResult> {
    
    try {

        await GoogleSignin.hasPlayServices();

        await GoogleSignin.signOut();

        const userInfo = await GoogleSignin.signIn();
        console.log('Google Sign-In successful, user info:', userInfo);

        const email = userInfo.data?.user?.email;

        if(!email) {
            throw new Error('No email found in Google user info');
        }

        const email_verified = userInfo.data?.user.email ? true : false;

        return {email, email_verified};

        
    } catch (error: any) {
        console.error('Error during Google Sign-In:', error);

        if(error.code === statusCodes.SIGN_IN_CANCELLED) {
            
            Alert.alert('Sign-In Cancelled', 'You cancelled the Google sign-in process.', [{ text: 'OK' }]);
        } else if (error.code === statusCodes.IN_PROGRESS) {
            Alert.alert('Sign-In In Progress', 'A sign-in operation (e.g. sign in) is in progress already', [{ text: 'OK' }]);
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {

            Alert.alert('Play Services Unavailable', 'Google Play Services is not available or outdated.', [{ text: 'OK' }]);
        } else {

            Alert.alert('Error', error.message || 'An unknown error occurred during Google sign-in.', [{ text: 'OK' }]);
        }

        throw error;
    }
}


