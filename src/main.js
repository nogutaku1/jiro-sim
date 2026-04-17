// ===== ENTRY =====
// Side-effect imports: core audio + cleanup registration
import './audio/core.js';
import './audio/ambient.js';

import { sceneTitle } from './scenes/title.js';
import { installTitleTapSecret } from './meta/secrets.js';

installTitleTapSecret();
sceneTitle();
