import React from 'react';
import Loader from '../Loader';
import GoogleSignInButton from  './GoogleSignInButton';
import chromePort from '../../helpers/chromePort';

const UnAuthenticatedSidebar = () => {
    chromePort.onMessage.addListener((msg) => {
        if (msg.type === "authentication") window.location.reload(false);
    });
    
    const Authentication = () => {
        const [authenticating, setAuthenticating] = React.useState(false);

        if (authenticating) return <Loader style={{width: '47px', height: '47px'}} />;
        return <GoogleSignInButton setAuthenticating={setAuthenticating} />;
    }

    return (
        <div id = "content-body" class = "login">
            <h1 style={{marginBottom: '5px', marginTop: '-15px'}}>Welcome to Test App</h1> 
            <h3 style={{marginBottom: '30px'}}>To get started please authenticate through Google</h3>
            <Authentication />
        </div>
    );
}

export default UnAuthenticatedSidebar;
