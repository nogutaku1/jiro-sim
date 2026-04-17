// ===== ENTRY =====
// Side-effect imports: core audio + cleanup registration + shop hydration
import './audio/core.js';
import './audio/ambient.js';
import './meta/shops.js';

import { sceneTitle } from './scenes/title.js';
import { initMetaGame } from './meta/init.js';
import { installTitleTapSecret } from './meta/secrets.js';

initMetaGame();
installTitleTapSecret();
sceneTitle();
