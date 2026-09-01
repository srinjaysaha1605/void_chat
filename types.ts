
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface UserProfile {
  name: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  sender: UserProfile;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isHistorical?: boolean;
}

/**
 * Represents a generated UI artifact for the terminal display
 */
export interface Artifact {
  id: string;
  html: string;
  status: 'streaming' | 'complete';
  styleName: string;
}
