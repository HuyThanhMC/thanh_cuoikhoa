
        feather.replace();

        AOS.init();

        const usernameInput = document.getElementById('usernameInput');
        const searchBtn = document.getElementById('searchBtn');
        const profileSection = document.getElementById('profileSection');
        const profileContent = document.getElementById('profileContent');
        const favoritesList = document.getElementById('favoritesList');
        const noFavoritesMessage = document.getElementById('noFavoritesMessage');
        const gamesList = document.getElementById('gamesList');
        const gamesLoading = document.getElementById('gamesLoading');
        const noGamesMessage = document.getElementById('noGamesMessage');
        const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');
        const loginBtn = document.getElementById('loginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const userGreeting = document.getElementById('userGreeting');
        const mobileUserGreeting = document.getElementById('mobileUserGreeting');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const mobileUsernameDisplay = document.getElementById('mobileUsernameDisplay');
        const loginModal = document.getElementById('loginModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalUsername = document.getElementById('modalUsername');
        const modalPassword = document.getElementById('modalPassword');
        const loginSubmitBtn = document.getElementById('loginSubmitBtn');
        const registerBtn = document.getElementById('registerBtn');
        const modalMessage = document.getElementById('modalMessage');
        const registerModal = document.getElementById('registerModal');
        const closeRegisterModalBtn = document.getElementById('closeRegisterModalBtn');
        const registerUsername = document.getElementById('registerUsername');
        const registerPassword = document.getElementById('registerPassword');
        const registerConfirmPassword = document.getElementById('registerConfirmPassword');
        const registerSubmitBtn = document.getElementById('registerSubmitBtn');
        const backToLoginBtn = document.getElementById('backToLoginBtn');
        const registerMessage = document.getElementById('registerMessage');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
        const chatbotContainer = document.getElementById('chatbotContainer');
        const minimizeChatbotBtn = document.getElementById('minimizeChatbotBtn');
        const chatbotMessages = document.getElementById('chatbotMessages');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotSendBtn = document.getElementById('chatbotSendBtn');
        
        // State
        let currentUser = null;
        let currentPlayer = null;
        let debounceTimer;
        
        // Initialize the app
        function initApp() {
            checkAuth();
            loadFavorites();
            setupEventListeners();
        }
        
        // Check if user is authenticated
        function checkAuth() {
            const user = localStorage.getItem('chess_dashboard_currentUser');
            if (user) {
                currentUser = JSON.parse(user);
                updateAuthUI();
            }
        }
        
        // Update UI based on auth status
        function updateAuthUI() {
            if (currentUser) {
                // Desktop
                loginBtn.classList.add('hidden');
                userGreeting.classList.remove('hidden');
                usernameDisplay.textContent = currentUser.username;
                
                // Mobile
                mobileLoginBtn.classList.add('hidden');
                mobileUserGreeting.classList.remove('hidden');
                mobileUsernameDisplay.textContent = currentUser.username;
            } else {
                // Desktop
                loginBtn.classList.remove('hidden');
                userGreeting.classList.add('hidden');
                
                // Mobile
                mobileLoginBtn.classList.remove('hidden');
                mobileUserGreeting.classList.add('hidden');
            }
        }
        
        // Load favorites from localStorage
        function loadFavorites() {
            const favoritesKey = currentUser ? `favorites:${currentUser.username}` : 'favorites:guest';
            const favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
            
            if (favorites.length === 0) {
                noFavoritesMessage.classList.remove('hidden');
                favoritesList.innerHTML = '';
            } else {
                noFavoritesMessage.classList.add('hidden');
                favoritesList.innerHTML = '';
                
                favorites.forEach(player => {
                    const favoriteItem = createFavoriteItem(player);
                    favoritesList.appendChild(favoriteItem);
                });
            }
        }
        
        // Create favorite item element
        function createFavoriteItem(player) {
            const item = document.createElement('div');
            item.className = 'bg-slate-700 rounded-lg p-3 flex items-center justify-between fade-in';
            
            item.innerHTML = `
                <div class="flex items-center space-x-3">
                    <img src="${player.avatar || 'http://static.photos/chess/200x200'}" alt="${player.username}" class="w-10 h-10 rounded-full">
                    <div>
                        <h4 class="font-medium">${player.username}</h4>
                        <div class="flex space-x-2 text-xs text-slate-400">
                            <span>Rapid: ${player.rapid_rating || 'N/A'}</span>
                            <span>Blitz: ${player.blitz_rating || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="view-favorite-btn p-1 text-slate-400 hover:text-emerald-400" data-username="${player.username}">
                        <i data-feather="eye" class="w-4 h-4"></i>
                    </button>
                    <button class="remove-favorite-btn p-1 text-slate-400 hover:text-red-400" data-username="${player.username}">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            // Re-initialize feather icons for the new elements
            feather.replace();
            
            return item;
        }
        
        // Search for a player
        async function searchPlayer(username) {
            if (!username) return;
            
            try {
                // Show loading state
                gamesLoading.classList.remove('hidden');
                gamesList.innerHTML = '';
                noGamesMessage.classList.add('hidden');
                
                // Fetch player profile
                const profileResponse = await fetch(`https://api.chess.com/pub/player/${username}`);
                
                if (!profileResponse.ok) {
                    throw new Error('Player not found');
                }
                
                const profile = await profileResponse.json();
                currentPlayer = profile;
                
                // Fetch player stats
                let stats = {};
                try {
                    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
                    if (statsResponse.ok) {
                        stats = await statsResponse.json();
                    }
                } catch (e) {
                    console.error('Error fetching stats:', e);
                }
                
                // Display profile
                displayProfile(profile, stats);
                
                // Fetch recent games
                try {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth() + 1; // 1-12
                    
                    const gamesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
                    
                    if (gamesResponse.ok) {
                        const gamesData = await gamesResponse.json();
                        displayGames(gamesData.games);
                    } else {
                        throw new Error('No games found');
                    }
                } catch (e) {
                    console.error('Error fetching games:', e);
                    gamesLoading.classList.add('hidden');
                    noGamesMessage.classList.remove('hidden');
                }
                
                // Update favorite button state
                updateFavoriteButton(username);
                
            } catch (error) {
                console.error('Error:', error);
                profileSection.classList.add('hidden');
                gamesLoading.classList.add('hidden');
                noGamesMessage.classList.remove('hidden');
                alert('Player not found. Please check the username and try again.');
            }
        }
        
        // Display player profile
        function displayProfile(profile, stats) {
            profileSection.classList.remove('hidden');
            
            const rapidRating = stats.chess_rapid?.last?.rating || 'N/A';
            const blitzRating = stats.chess_blitz?.last?.rating || 'N/A';
            const bulletRating = stats.chess_bullet?.last?.rating || 'N/A';
            
            profileContent.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${profile.avatar || 'http://static.photos/chess/200x200'}" alt="${profile.username}" class="w-16 h-16 rounded-full">
                    <div>
                        <h3 class="text-xl font-bold">${profile.username}</h3>
                        <div class="flex items-center text-slate-400">
                            <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                            <span>${profile.country ? profile.country.split('/').pop().toUpperCase() : 'Unknown'}</span>
                        </div>
                        <div class="text-sm text-slate-400">
                            Joined: ${new Date(profile.joined * 1000).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 pt-4">
                    <div class="bg-slate-700 rounded-lg p-3 text-center">
                        <div class="text-sm text-slate-400">Rapid</div>
                        <div class="text-xl font-bold">${rapidRating}</div>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3 text-center">
                        <div class="text-sm text-slate-400">Blitz</div>
                        <div class="text-xl font-bold">${blitzRating}</div>
                    </div>
                    <div class="bg-slate-700 rounded-lg p-3 text-center">
                        <div class="text-sm text-slate-400">Bullet</div>
                        <div class="text-xl font-bold">${bulletRating}</div>
                    </div>
                </div>
            `;
            
            feather.replace();
        }
        
        // Display recent games
        function displayGames(games) {
            gamesLoading.classList.add('hidden');
            
            if (!games || games.length === 0) {
                noGamesMessage.classList.remove('hidden');
                return;
            }
            
            // Sort games by date (newest first)
            games.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
            
            // Display only the last 10 games
            const recentGames = games.slice(0, 10);
            
            recentGames.forEach(game => {
                const gameElement = createGameElement(game);
                gamesList.appendChild(gameElement);
            });
            
            feather.replace();
        }
        
        // Create game element
        function createGameElement(game) {
            const isWhite = game.white.username.toLowerCase() === currentPlayer.username.toLowerCase();
            const opponent = isWhite ? game.black : game.white;
            const playerRating = isWhite ? game.white.rating : game.black.rating;
            const opponentRating = isWhite ? game.black.rating : game.white.rating;
            
            let result;
            let resultClass;
            
            if (game.white.result === 'win' && isWhite) {
                result = 'Win';
                resultClass = 'game-result-win';
            } else if (game.black.result === 'win' && !isWhite) {
                result = 'Win';
                resultClass = 'game-result-win';
            } else if (game.white.result === 'draw' || game.black.result === 'draw') {
                result = 'Draw';
                resultClass = 'game-result-draw';
            } else {
                result = 'Loss';
                resultClass = 'game-result-loss';
            }
            
            const gameDate = new Date(game.end_time * 1000).toLocaleDateString();
            
            const gameElement = document.createElement('div');
            gameElement.className = 'bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition cursor-pointer fade-in';
            
            gameElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <img src="${opponent.avatar || 'http://static.photos/chess/200x200'}" alt="${opponent.username}" class="w-10 h-10 rounded-full">
                        <div>
                            <h4 class="font-medium">${opponent.username}</h4>
                            <div class="flex space-x-2 text-xs text-slate-400">
                                <span>${isWhite ? 'White' : 'Black'}</span>
                                <span>${playerRating} vs ${opponentRating}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="${resultClass} font-medium">${result}</span>
                        <span class="text-sm text-slate-400">${gameDate}</span>
                        <a href="${game.url}" target="_blank" class="text-slate-400 hover:text-emerald-400">
                            <i data-feather="external-link" class="w-4 h-4"></i>
                        </a>
                    </div>
                </div>
            `;
            
            return gameElement;
        }
        
        // Update favorite button state
        function updateFavoriteButton(username) {
            if (!username) return;
            
            const favoritesKey = currentUser ? `favorites:${currentUser.username}` : 'favorites:guest';
            const favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
            
            const isFavorite = favorites.some(player => player.username.toLowerCase() === username.toLowerCase());
            
            if (isFavorite) {
                addToFavoritesBtn.innerHTML = `
                    <i data-feather="star" class="mr-1 w-4 h-4 text-yellow-400"></i> Remove from Favorites
                `;
                addToFavoritesBtn.classList.remove('bg-slate-700');
                addToFavoritesBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                addToFavoritesBtn.dataset.action = 'remove';
            } else {
                addToFavoritesBtn.innerHTML = `
                    <i data-feather="star" class="mr-1 w-4 h-4"></i> Add to Favorites
                `;
                addToFavoritesBtn.classList.add('bg-slate-700');
                addToFavoritesBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
                addToFavoritesBtn.dataset.action = 'add';
            }
            
            feather.replace();
        }
        
        // Toggle favorite player
        function toggleFavorite() {
            if (!currentPlayer) return;
            
            const username = currentPlayer.username;
            const favoritesKey = currentUser ? `favorites:${currentUser.username}` : 'favorites:guest';
            let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
            
            const existingIndex = favorites.findIndex(player => player.username.toLowerCase() === username.toLowerCase());
            
            if (existingIndex >= 0) {
                // Remove from favorites
                favorites.splice(existingIndex, 1);
                localStorage.setItem(favoritesKey, JSON.stringify(favorites));
                updateFavoriteButton(username);
                loadFavorites();
            } else {
                // Add to favorites
                const playerData = {
                    username: currentPlayer.username,
                    avatar: currentPlayer.avatar,
                    rapid_rating: currentPlayer.chess_rapid?.last?.rating,
                    blitz_rating: currentPlayer.chess_blitz?.last?.rating,
                    bullet_rating: currentPlayer.chess_bullet?.last?.rating
                };
                
                favorites.push(playerData);
                localStorage.setItem(favoritesKey, JSON.stringify(favorites));
                updateFavoriteButton(username);
                loadFavorites();
            }
        }
        
        // Handle login
        function handleLogin() {
            const username = modalUsername.value.trim();
            const password = modalPassword.value.trim();
            
            if (!username || !password) {
                modalMessage.textContent = 'Please enter both username and password';
                modalMessage.classList.remove('hidden');
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('chess_dashboard_users')) || [];
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                currentUser = { username: user.username, userId: user.userId };
                localStorage.setItem('chess_dashboard_currentUser', JSON.stringify(currentUser));
                updateAuthUI();
                loadFavorites();
                loginModal.classList.add('hidden');
                modalMessage.classList.add('hidden');
            } else {
                modalMessage.textContent = 'Invalid username or password';
                modalMessage.classList.remove('hidden');
            }
        }
        
        // Handle registration
        function handleRegistration() {
            const username = registerUsername.value.trim();
            const password = registerPassword.value.trim();
            const confirmPassword = registerConfirmPassword.value.trim();
            
            if (!username || !password || !confirmPassword) {
                registerMessage.textContent = 'Please fill in all fields';
                registerMessage.classList.remove('hidden');
                return;
            }
            
            if (password !== confirmPassword) {
                registerMessage.textContent = 'Passwords do not match';
                registerMessage.classList.remove('hidden');
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('chess_dashboard_users')) || [];
            
            if (users.some(u => u.username === username)) {
                registerMessage.textContent = 'Username already exists';
                registerMessage.classList.remove('hidden');
                return;
            }
            
            const newUser = {
                userId: Date.now().toString(),
                username,
                password
            };
            
            users.push(newUser);
            localStorage.setItem('chess_dashboard_users', JSON.stringify(users));
            
            registerMessage.textContent = 'Registration successful! Please login.';
            registerMessage.classList.remove('hidden');
            registerMessage.classList.add('text-green-400');
            
            // Switch back to login modal
            setTimeout(() => {
                registerModal.classList.add('hidden');
                loginModal.classList.remove('hidden');
                registerMessage.classList.add('hidden');
                registerMessage.classList.remove('text-green-400');
            }, 1500);
        }
        
        // Handle logout
        function handleLogout() {
            currentUser = null;
            localStorage.removeItem('chess_dashboard_currentUser');
            updateAuthUI();
            loadFavorites();
        }
        
        // View favorite profile
        function viewFavoriteProfile(username) {
            usernameInput.value = username;
            searchPlayer(username);
        }
        
        // Remove favorite
        function removeFavorite(username) {
            const favoritesKey = currentUser ? `favorites:${currentUser.username}` : 'favorites:guest';
            let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
            
            favorites = favorites.filter(player => player.username.toLowerCase() !== username.toLowerCase());
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            
            loadFavorites();
            
            // If we're currently viewing this player's profile, update the favorite button
            if (currentPlayer && currentPlayer.username.toLowerCase() === username.toLowerCase()) {
                updateFavoriteButton(username);
            }
        }
        
        // Handle chatbot message
        async function handleChatbotMessage(message) {
            if (!message.trim()) return;
            
            // Add user message to chat
            addChatbotMessage(message, 'user');
            
            // Process message
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('elo of') || lowerMessage.includes('rating of')) {
                // Extract player name
                let playerName = message.split('elo of')[1] || message.split('rating of')[1];
                if (!playerName) playerName = message.split('Elo of')[1] || message.split('Rating of')[1];
                
                playerName = playerName.trim();
                
                // Handle special cases
                if (playerName.toLowerCase() === 'magnus') {
                    playerName = 'magnuscarlsen';
                }
                
                try {
                    const statsResponse = await fetch(`https://api.chess.com/pub/player/${playerName}/stats`);
                    
                    if (!statsResponse.ok) {
                        addChatbotMessage(`I couldn't find ratings for ${playerName}. Please check the spelling and try again.`, 'bot');
                        return;
                    }
                    
                    const stats = await statsResponse.json();
                    
                    let response = `Ratings for ${playerName}:`;
                    
                    if (stats.chess_rapid?.last?.rating) {
                        response += `\nRapid: ${stats.chess_rapid.last.rating}`;
                    }
                    
                    if (stats.chess_blitz?.last?.rating) {
                        response += `\nBlitz: ${stats.chess_blitz.last.rating}`;
                    }
                    
                    if (stats.chess_bullet?.last?.rating) {
                        response += `\nBullet: ${stats.chess_bullet.last.rating}`;
                    }
                    
                    if (!stats.chess_rapid && !stats.chess_blitz && !stats.chess_bullet) {
                        response = `No recent ratings found for ${playerName}.`;
                    }
                    
                    addChatbotMessage(response, 'bot');
                    
                } catch (error) {
                    console.error('Error fetching stats:', error);
                    addChatbotMessage('Sorry, I encountered an error while fetching the ratings. Please try again later.', 'bot');
                }
                
            } else if (lowerMessage.includes('number 1') || lowerMessage.includes('best player')) {
                addChatbotMessage('Magnus Carlsen is widely considered the number 1 chess player in the world.', 'bot');
                
            } else if (lowerMessage.includes('train') || lowerMessage.includes('practice') || lowerMessage.includes('improve')) {
                const tips = [
                    'Here are some training tips:',
                    '1. Study openings: Learn 1-2 openings for white and black',
                    '2. Practice tactics daily: Use chess puzzles to improve pattern recognition',
                    '3. Learn endgames: Master basic checkmates and pawn endgames',
                    '4. Analyze your games: Review mistakes to learn from them',
                    '5. Play regularly: Mix time controls (rapid, blitz, classical)',
                    '6. Watch master games: Learn from top players\' strategies'
                ];
                
                addChatbotMessage(tips.join('\n'), 'bot');
                
            } else {
                const helpMessage = [
                    "I'm not sure how to answer that. Here are some things I can help with:",
                    "- 'Elo of Magnus' - Get player ratings",
                    "- 'Who is number 1 player?' - Learn about top players",
                    "- 'How should I train?' - Get chess training tips"
                ];
                
                addChatbotMessage(helpMessage.join('\n'), 'bot');
            }
        }
        
        // Add message to chatbot
        function addChatbotMessage(message, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `text-sm mb-2 ${sender === 'user' ? 'text-right' : 'text-left'}`;
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = sender === 'user' 
                ? 'bg-emerald-600 rounded-lg p-3 inline-block max-w-xs text-white' 
                : 'bg-slate-600 rounded-lg p-3 inline-block max-w-xs';
            
            // Split message by newlines and create separate elements for each line
            const lines = message.split('\n');
            lines.forEach((line, index) => {
                if (index > 0) {
                    bubbleDiv.appendChild(document.createElement('br'));
                }
                bubbleDiv.appendChild(document.createTextNode(line));
            });
            
            messageDiv.appendChild(bubbleDiv);
            chatbotMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Search functionality
            searchBtn.addEventListener('click', () => {
                searchPlayer(usernameInput.value.trim());
            });
            
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchPlayer(usernameInput.value.trim());
                }
            });
            
            // Debounce search input for better UX
            usernameInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (usernameInput.value.trim().length >= 3) {
                        searchPlayer(usernameInput.value.trim());
                    }
                }, 500);
            });
            
            // Favorite button
            addToFavoritesBtn.addEventListener('click', toggleFavorite);
            
            // Auth buttons
            loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
            mobileLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
            logoutBtn.addEventListener('click', handleLogout);
            mobileLogoutBtn.addEventListener('click', handleLogout);
            
            // Modal buttons
            closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
            loginSubmitBtn.addEventListener('click', handleLogin);
            registerBtn.addEventListener('click', () => {
                loginModal.classList.add('hidden');
                registerModal.classList.remove('hidden');
            });
            
            closeRegisterModalBtn.addEventListener('click', () => registerModal.classList.add('hidden'));
            registerSubmitBtn.addEventListener('click', handleRegistration);
            backToLoginBtn.addEventListener('click', () => {
                registerModal.classList.add('hidden');
                loginModal.classList.remove('hidden');
            });
            
            // Mobile menu
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                mobileMenuBtn.innerHTML = mobileMenu.classList.contains('hidden') 
                    ? '<i data-feather="menu"></i>' 
                    : '<i data-feather="x"></i>';
                feather.replace();
            });
            
            // Chatbot
            chatbotToggleBtn.addEventListener('click', () => {
                chatbotContainer.classList.toggle('hidden');
                chatbotToggleBtn.innerHTML = chatbotContainer.classList.contains('hidden')
                    ? '<i data-feather="message-square"></i>'
                    : '<i data-feather="x"></i>';
                feather.replace();
            });
            
            minimizeChatbotBtn.addEventListener('click', () => {
                chatbotContainer.classList.add('hidden');
                chatbotToggleBtn.innerHTML = '<i data-feather="message-square"></i>';
                feather.replace();
            });
            
            chatbotSendBtn.addEventListener('click', () => {
                const message = chatbotInput.value.trim();
                if (message) {
                    handleChatbotMessage(message);
                    chatbotInput.value = '';
                }
            });
            
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const message = chatbotInput.value.trim();
                    if (message) {
                        handleChatbotMessage(message);
                        chatbotInput.value = '';
                    }
                }
            });
            
            // Event delegation for dynamically added elements
            document.addEventListener('click', (e) => {
                // View favorite profile
                if (e.target.closest('.view-favorite-btn')) {
                    const username = e.target.closest('.view-favorite-btn').dataset.username;
                    viewFavoriteProfile(username);
                }
                
                // Remove favorite
                if (e.target.closest('.remove-favorite-btn')) {
                    const username = e.target.closest('.remove-favorite-btn').dataset.username;
                    removeFavorite(username);
                }
            });
        }
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', initApp);








    