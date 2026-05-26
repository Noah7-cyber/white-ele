import React, { useRef, useState } from 'react';
import { CircularProgress, Modal } from '@mui/material';

interface PaystackCheckoutProps {
  url: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PayStackCheckModal: React.FC<PaystackCheckoutProps> = ({
  url,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);

  const counter = useRef(0);

  const onPaymentIframeLoad = () => {
    setLoading(false);
    if (counter.current === 1) {
      counter.current = 0;
      onSuccess?.();
    } else {
      counter.current += 1;
    }
  };

  const defaultModalStyle = {
    display: 'flex',
    alignItems: { xs: 'flex-end', sm: 'center' },
    justifyContent: 'center',
    backdropFilter: { xs: 'blur(4px)', sm: 'none' },
  };

  return (
    <Modal
      open={!!url}
      onClose={() => {
        onCancel();
        counter.current = 0;
      }}
      closeAfterTransition
      sx={{ ...defaultModalStyle }}
    >
      <div
        className="md:min-w-[600px] min-w-[83vw]"
        style={{ height: '700px', position: 'relative' }}
      >
        {loading && (
          <div
            className="absolute top-[50%] left-[50%] z-20"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <CircularProgress
              className="text-[#DC6803]"
              size={40}
            />
          </div>
        )}
        <iframe
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          src={url}
          style={{ width: '100%', border: 'none', height: '100%' }}
          className="w-full h-full border-none"
          onLoad={onPaymentIframeLoad}
        />
      </div>
    </Modal>
  );
};