// ===== ENTRY =====
// Side-effect imports: core audio + cleanup registration
import './audio/core.js';
import './audio/ambient.js';
import './meta/shops.js';

import { sceneTitle } from './scenes/title.js';

sceneTitle();
