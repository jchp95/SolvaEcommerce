import { useSelector } from 'react-redux';
import { RingLoader } from 'react-spinners';
import { css } from '@emotion/react';

const override = css`
  display: block;
  margin: 0 auto;
`;

const Spinner = () => {
  const { loading, color, size, speedMultiplier } = useSelector(state => state.spinner);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <RingLoader
        color={color}
        size={size}
        css={override}
        speedMultiplier={speedMultiplier}
      />
    </div>
  );
};

export default Spinner;
