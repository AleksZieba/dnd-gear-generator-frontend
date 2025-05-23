import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import ResponseModal, { GearResponse } from './ResponseModal';
import { AnimatePresence, motion } from 'framer-motion';
import './GearForm.css';

interface GearRequest {
  name?: string;
  type: 'Weapon' | 'Armor' | 'Jewelry';
  handedness?: 'Single-Handed' | 'Two-Handed' | 'Versatile';
  subtype: string;
  rarity: string;
  description?: string;
  clothingPiece?: string;
}

const weaponHandOptions = ['Single-Handed', 'Two-Handed', 'Versatile'] as const;
const weaponTypeOptions: Record<typeof weaponHandOptions[number], string[]> = {
  'Single-Handed': [
    'Club', 'Dagger', 'Flail', 'Hand Crossbows', 'Handaxe',
    'Javelin', 'Light Hammer', 'Mace', 'Rapier', 'Scimitar',
    'Shortsword', 'Sickle', 'War pick'
  ].sort(),
  'Versatile': [
    'Battleaxe', 'Longsword', 'Quarterstaff', 'Spear',
    'Staff', 'Trident', 'Warhammer'
  ].sort(),
  'Two-Handed': [
    'Glaive', 'Greatclub', 'Greatsword', 'Greataxe', 'Halberd',
    'Heavy Crossbow', 'Light Crossbow', 'Longbow', 'Maul',
    'Pike', 'Shortbow'
  ].sort(),
};
const armorOptions = ['Clothes', 'Light', 'Medium', 'Heavy', 'Shield'] as const;

const GearForm: React.FC = () => {
  const [name, setName]               = useState('');
  const [type, setType]               = useState<'Weapon'|'Armor'|'Jewelry'|''>('');
  const [handedness, setHandedness]   = useState<typeof weaponHandOptions[number] | ''>('');
  const [subtype, setSubtype]         = useState('');
  const [rarity, setRarity]           = useState('');
  const [description, setDescription] = useState('');
  const [clothingPiece, setClothingPiece] = useState('');
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState('');
  const [lastRequest, setLastRequest] = useState<GearRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<GearResponse | null>(null);
  const [lastWasRandom, setLastWasRandom] = useState(false);
  
  const hasBadChar = (s: string) => /[\\`'"{}]/.test(s);

  async function sendRequest(
    reqPayload: GearRequest | null,
    random = false
  ) {
    setLoading(true);
    setMessage('');
    try {
      let res;
      if (random) {
        res = await axios.get<GearResponse>('/api/gear/random');
      } else {
        if (!reqPayload) throw new Error('No payload to send');
        res = await axios.get<GearResponse>('/api/gear', { params: reqPayload});
      }
      setCurrentResponse(res.data);
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      setMessage(random
        ? 'Error fetching random gear.'
        : 'Error sending gear request.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (hasBadChar(name) || hasBadChar(description)) {
      setMessage('The characters \\ ` \' " { } are not allowed.');
      return;
    }

    const payload: GearRequest = { type: type as any, subtype, rarity };
    if (name.trim())          payload.name           = name.trim();
    if (type === 'Weapon')    payload.handedness     = handedness as any;
    if (type === 'Armor' && subtype !== 'Shield')
                               payload.clothingPiece  = clothingPiece;
    if (description.trim())   payload.description    = description.trim();

    setLastRequest(payload);
    setLastWasRandom(false);

    await sendRequest(payload, false);
  };

  const handleRandomize = async () => {
    setLastWasRandom(true);
    setLastRequest(null);
    await sendRequest(null, true);
  };

  const handleReroll = async () => {
    await sendRequest(lastRequest, lastWasRandom);
  };

  return (
    <>
      {loading && (
        <div className="loading-backdrop">
          <div className="loading-spinner" />
        </div>
      )}

      <motion.form className="form" onSubmit={handleSubmit}>
        <h2 className="gearform-label">Generate DND 5E Item</h2>

        <button
          type="button"
          className="randomize-button"
          onClick={handleRandomize}
          disabled={loading}
        >
          {loading && lastWasRandom ? 'Loading…' : 'Randomize'}
        </button>

        <hr />

        <label>
          Item Name:
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="(Optional)"
            disabled={loading}
          />
        </label>

        <label>
          Type:
          <select
            className="form-input"
            value={type}
            onChange={e => {
              setType(e.target.value as any);
              setHandedness('');
              setSubtype('');
              setClothingPiece('');
            }}
            required
            disabled={loading}
          >
            <option value="">Select Type</option>
            <option value="Weapon">Weapon</option>
            <option value="Armor">Armor</option>
            <option value="Jewelry">Jewelry</option>
          </select>
        </label>

        <AnimatePresence initial={false}>
          {type === 'Jewelry' && (
            <motion.div
              key="jewelry"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label>
                Jewelry Category:
                <select
                  className="form-input"
                  value={subtype}
                  onChange={e => setSubtype(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  <option value="Ring">Ring</option>
                  <option value="Necklace">Necklace</option>
                </select>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {type === 'Weapon' && (
            <motion.div
              key="weapon-cat"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label>
                Weapon Category:
                <select
                  className="form-input"
                  value={handedness}
                  onChange={e => {
                    setHandedness(e.target.value as any);
                    setSubtype('');
                  }}
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {weaponHandOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {type === 'Weapon' && handedness && (
            <motion.div
              key="weapon-type"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label>
                Weapon Type:
                <select
                  className="form-input"
                  value={subtype}
                  onChange={e => setSubtype(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select Weapon</option>
                  {weaponTypeOptions[handedness].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {type === 'Armor' && (
            <motion.div
              key="armor-class"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label>
                Armor Class:
                <select
                  className="form-input"
                  value={subtype}
                  onChange={e => {
                    setSubtype(e.target.value);
                    setClothingPiece('');
                  }}
                  required
                  disabled={loading}
                >
                  <option value="">Select Armor Class</option>
                  {armorOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {type === 'Armor' && subtype && subtype !== 'Shield' && (
            <motion.div
              key="armor-piece"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label>
                {subtype === 'Clothes' ? 'Clothing Piece:' : 'Armor Piece:'}
                <select
                  className="form-input"
                  value={clothingPiece}
                  onChange={e => setClothingPiece(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select Piece</option>
                  {(subtype === 'Clothes'
                    ? ['Boots','Clothes','Cloak','Gloves','Headgear','Robes','Shoes']
                    : ['Boots','Chest Armor','Greaves','Headgear']
                  ).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <label>
          Rarity:
          <select
            className="form-input"
            value={rarity}
            onChange={e => setRarity(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select Rarity</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Very Rare">Very Rare</option>
            <option value="Legendary">Legendary</option>
            <option value="Artifact">Artifact</option>
          </select>
        </label>

        <label>
          Additional Details:
          <textarea
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional extra flavor or requirements..."
            disabled={loading}
          />
        </label>

        <button type="submit" disabled={loading && !lastWasRandom}>
          {loading && !lastWasRandom ? 'Loading…' : 'Submit'}
        </button>

        {message && <p className="message">{message}</p>}
      </motion.form>

      {modalVisible && currentResponse && (
        <ResponseModal
          data={currentResponse}
          onClose={() => setModalVisible(false)}
          onReroll={handleReroll}
          loading={loading}
        />
      )}

      {loading && (
        <div className="loading-backdrop">
          <div className="loading-spinner" />
        </div>
      )}
    </>
  );
};

export default GearForm;