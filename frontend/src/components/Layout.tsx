import { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthDialog from '@/components/AuthDialog';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <AuthDialog />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}


