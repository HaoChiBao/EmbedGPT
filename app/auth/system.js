const firebaseConfig = {
    apiKey: "AIzaSyDX15pISaNRAH_iQ-il50sLundPLVitokw",
    authDomain: "what-do-you-see-1c8c4.firebaseapp.com",
    databaseURL: "https://what-do-you-see-1c8c4-default-rtdb.firebaseio.com",
    projectId: "what-do-you-see-1c8c4",
    storageBucket: "what-do-you-see-1c8c4.appspot.com",
    messagingSenderId: "616885293756",
    appId: "1:616885293756:web:672fddf1e5d3894f1976b9",
    measurementId: "G-6WB73TG33V"
};

class System {
    // load firebase config
    #firebaseConfig = firebaseConfig;    

    static DEFAULT_USER_DATA = {
        email: "new email",
        uid: "",
        data: {
            allChats: {
                test: 'test'
            }
        }
    }

    #accountHeader = "Users";
    #userCredentials = {};
    #userData = {};

    constructor() {
    }

    init = async (userCredentials) => {

        if(userCredentials === null) return -1

        this.#userCredentials = userCredentials;

        const userData = await this.#get(`/${this.#accountHeader}/${this.#userCredentials.localId}`)

        if (userData.response === null) {
            this.#createUserDetails();
        } else {
            this.#userData = userData.response;
        }
    }

    signInWithEmailAndPassword = async (email, password) => {
        try {
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.#firebaseConfig.apiKey}`, {
            //   const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyC_3AUmJ8rDAr0E95xq9K80PCbzgyuSlLo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true,
                }),
            });
      
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message);
            }
      
            const userCredentials = await response.json();
            
            this.#userCredentials = userCredentials;
            this.#userCredentials.expiresIn = Date.now() + (userCredentials.expiresIn * 1000);
            console.log("Credentials Retrieved")

            /*
            get the current user data and see if there is a reference in the database
            if not then create a new reference in the db (using the default user data)
            */
            const userData = await this.#get(`/${this.#accountHeader}/${this.#userCredentials.localId}`)
            console.log("User Data Retrieved")

            if (userData.response === null) {
                this.#createUserDetails();
                // const uid = this.#userCredentials.localId;
                // this.#userData = System.DEFAULT_USER_DATA;
                // this.#userData.uid = uid;

                // await this.#post(`/${this.#accountHeader}/${uid}`, this.#userData)
            } else {
                this.#userData = userData.response;
            } 

            // chrome.runtime.localStorage.set({NODESuserCredentials: this.#userCredentials});

            // console.log("User signed in:", userData);
        } catch (error) {
            console.error("Authentication error:", error.message);
        }
    };

    #createUserDetails = async () => {
        const uid = this.#userCredentials.localId;
        this.#userData = System.DEFAULT_USER_DATA;
        this.#userData.uid = uid;
        this.#userData.email = this.#userCredentials.email;

        console.log(this.#userData)
        const response = await this.#post(`/${this.#accountHeader}/${uid}`, this.#userData)
        console.log(response)
    }

    createNewAccount = async (email, password) => {
        try {
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.#firebaseConfig.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true,
                }),
             });
      
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message);
            }
      
            const userCredentials = await response.json();
            this.#userCredentials = userCredentials;
            this.#userCredentials.expiresIn = Date.now() + (userCredentials.expiresIn * 1000);

            // console.log(this.#userCredentials)
            await this.#createUserDetails();
            // console.log("Account created:", userData);
        }   
        catch (error) {
            console.error("Account creation error:", error.message);
        }
    };

    #refreshToken = async () => {
        try {
            const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${this.#firebaseConfig.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: this.#userCredentials.refreshToken,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message);
            }

            const userCredentials = await response.json();
            this.#userCredentials.idToken = userCredentials.id_token;
            this.#userCredentials.refreshToken = userCredentials.refresh_token;

            // expires in
            console.log("Token refreshed:", userCredentials.expires_in)
        } catch (error) {
            console.error("Token refresh error:", error.message);
        }
    }

    signOut = async () => {
        this.#userCredentials = {};
        this.#userData = {};
        console.log("User signed out");
    }

    // post data to firebase
    #post = async (path, data) => {
        let response = null;

        const t1 = performance.now();

        // make a post request to firebase
        // this uses databaseUrl and the user idToken from GCP identity platform
        // const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/your_collection_name?access_token=${authToken}`;
        // await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents${path}?access_token=${this.#userCredentials.idToken}`, {
        await fetch(`${this.#firebaseConfig.databaseURL}${path}.json?auth=${this.#userCredentials.idToken}`, {
                method: 'PATCH',
                headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            // body: test,
        })
        .then(response => response.json())
        .then(updatedData => {
            // console.log('Data updated:', updatedData);
            response = updatedData;
        })
        .catch(error => console.error('Error updating data:', error));
        
        const t2 = performance.now();
        
        const ping = t2 - t1;
        return {
            response: response, 
            ping: ping,
        };
    }

    // get data from firebase
    #get = async (path) => {
        let response = null;
        
        const t1 = performance.now();
        
        // await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents${path}`, {
        await fetch(`${this.#firebaseConfig.databaseURL}${path}.json?auth=${this.#userCredentials.idToken}`, {

            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.#userCredentials.idToken,
            },
        })
        .then(response => response.json())
        .then(data => {
            // console.log('Data received:', data);
            response = data;
        })
        .catch(error => console.error('Error receiving data:', error));
        
        const t2 = performance.now();

        const ping = t2 - t1;
        return {
            response: response, 
            ping: ping,
        };
    }

    // update the db user data with local user data
    updateUser = async () => {
        const path = `/${this.#accountHeader}/${this.#userData.uid}`

        // overwrite the user data in the db with the local user data
        const status = await this.#post(path, this.#userData)

        return status;
    }

    // testing purposes
    get userCredentials() {
        return this.#userCredentials;
    }

    get userData() {
        return this.#userData;
    }

    set userData(data) {
        this.#userData = data;
    }
}

const main = async () => {

    const auth = {
        e: 'test123@gmail.com',
        p: 'test123',
    } 

    const system = new System();
    await system.signInWithEmailAndPassword(auth.e, auth.p);
    // await system.createNewAccount(auth.e, auth.p);

    console.log(system.userCredentials)
    // console.log(system.userData)
}

// main()

export default System;