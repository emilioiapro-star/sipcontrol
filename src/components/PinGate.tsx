import { useState, type FormEvent } from 'react';
import { createSalt, derivePinHash, verifyPin } from '../utils/crypto';

type SetupPayload = {
  pinHash: string;
  pinSalt: string;
};

type Props = {
  mode: 'setup' | 'unlock';
  title: string;
  subtitle: string;
  pinHash?: string | null;
  pinSalt?: string | null;
  onUnlock?: () => void;
  onSetup?: (payload: SetupPayload) => void;
};

export const PinGate = ({
  mode,
  title,
  subtitle,
  pinHash,
  pinSalt,
  onUnlock,
  onSetup,
}: Props) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isValidPin = (value: string) => /^\d{4,6}$/.test(value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'setup') {
        if (!isValidPin(pin)) throw new Error('PIN debe tener 4 a 6 dígitos.');
        if (pin !== confirmPin) throw new Error('El PIN no coincide.');
        const salt = createSalt();
        const hash = await derivePinHash(pin, salt);
        onSetup?.({ pinHash: hash, pinSalt: salt });
      } else {
        if (!pinHash || !pinSalt) throw new Error('PIN no configurado.');
        const ok = await verifyPin(pin, pinHash, pinSalt);
        if (!ok) throw new Error('PIN incorrecto.');
        onUnlock?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
      setPin('');
      setConfirmPin('');
    }
  };

  return (
    <div className="overlay-lock">
      <form className="lock-card glass-card" onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        {mode === 'setup' && (
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            type="password"
            placeholder="Confirmar PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        )}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Procesando...' : mode === 'setup' ? 'Guardar PIN' : 'Desbloquear'}
        </button>
      </form>
    </div>
  );
};
