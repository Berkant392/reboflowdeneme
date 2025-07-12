import React, { useState } from 'react';
import { credentials } from '../data/credentials';

const LoginPage = ({ onLoginSuccess }) => { 
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [loginError, setLoginError] = useState(''); 

    const handleLogin = (e) => { 
        e.preventDefault(); 
        if (credentials.has(username) && credentials.get(username) === password) { 
            onLoginSuccess(); 
        } else { 
            setLoginError('Kullanıcı adı veya şifre hatalı. Halkalı Fen Bilimleri Merkezi öğrencisi iseniz Berkant Hocadan kullanıcı adı ve şifre alabilirsiniz.'); 
        } 
    }; 

    return ( 
        <div className="login-container">
            <ul className="bubbles">
                <li></li><li></li><li></li><li></li><li></li>
                <li></li><li></li><li></li><li></li><li></li>
                <li></li><li></li><li></li><li></li><li></li>
            </ul>
            <div className="login-form-container mx-4"> 
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center"> 
                    Soru Çözücü
                </h1> 
                <p className="text-gray-200 mb-8 text-center">Halkalı Fen Bilimleri Merkezi'ne Hoş Geldiniz</p> 
                <form onSubmit={handleLogin} className="space-y-6"> 
                    <input  
                        type="text" 
                        placeholder="Kullanıcı Adı" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        className="w-full px-4 py-3 bg-white bg-opacity-20 text-white placeholder-gray-300 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-white" 
                    /> 
                    <input  
                        type="password" 
                        placeholder="Şifre" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full px-4 py-3 bg-white bg-opacity-20 text-white placeholder-gray-300 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-white" 
                    /> 
                    <button type="submit" className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300 shadow-lg"> 
                        Giriş Yap 
                    </button> 
                </form> 
                {loginError && <p className="mt-6 text-sm text-yellow-300 bg-yellow-500 bg-opacity-30 p-3 rounded-lg text-center">{loginError}</p>} 
            </div> 
        </div> 
    ); 
};

export default LoginPage;
