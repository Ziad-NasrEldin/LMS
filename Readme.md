**Project Documentation (How To Guide )** <br>

1- clone or pull latest update from the repository <br>
2- open the project in your prefered IDE <br>
3- cd kalima-platform <br>
4- npm install <br>
5- npm start for default website development. <br>
6- npm run build for production <br>

**Testing for android** <br>
<br>
1- Download Android Studio and install <br>
2- Download Java JDK 21 from oracle.com <br>
3- Configure environment variables for %ANDROID_HOME% and %JAVA_HOME% <br>
4- npm run build. <br>
5- npx cap sync. <br>
6- npx cap run android. <br>
**How to configure environment variables** <br>
<br>
1- After installing Android Studio, go to search bar and type "environment variables". <br>
2- Click on "Edit the system environment variables" <br>
3- Click on "Environment Variables" <br>
4- Click on "New" <br>
5- Type "ANDROID_HOME" in the "Variable name" field and "C:\Users\<username>\AppData\Local\Android\Sdk" in the "Variable value" field with username being your device username. <br>
6- Click on "New" <br>
7- Type "JAVA_HOME" in the "Variable name" field and "C:\Program Files\Java\jdk-21" in the "Variable value" field. <br>
8- Click on "OK" <br>
9- restart your IDE and terminal. <br>
10- in cmd prompt or powershell as admin, run the following commands : <br>
    - setx JAVA_HOME "C:\Program Files\Java\jdk-17" <br>
    - setx PATH "%PATH%;%JAVA_HOME%\bin" <br>
10- to verify, open cmd prompt as administrator and type echo %ANDROID_HOME% and echo %JAVA_HOME% and it should show you the locations of both the variables.
