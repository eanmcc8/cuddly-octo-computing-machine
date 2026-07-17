import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NftPanel() {
  const { currentWallet, nfts, fetchNFTs, isFetchingNFTs, currentNetwork } = useWallet();

  if (!currentWallet) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">No Wallet Selected</h3>
          <p className="text-sm text-slate-500">Import a wallet to view NFTs.</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentWallet.permissions.allowSend) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">Access Disabled</h3>
          <p className="text-sm text-slate-500">NFT viewing is disabled for this wallet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
            <ImageIcon className="w-4 h-4 text-purple-400" /> NFT Gallery
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchNFTs} disabled={isFetchingNFTs || currentNetwork.id !== 'ethereum'} className="text-slate-400 hover:text-purple-400 text-xs h-7 disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={cn('w-3 h-3 mr-1', isFetchingNFTs && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {currentNetwork.id !== 'ethereum' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>NFT fetching is currently only supported on Ethereum Mainnet.</span>
          </div>
        )}
        {isFetchingNFTs ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">No NFTs Found</h3>
            <p className="text-sm text-slate-500 max-w-xs">This wallet doesn't own any NFTs on Ethereum Mainnet, or they haven't been fetched yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                <div className="aspect-square overflow-hidden bg-slate-800">
                  {nft.image ? (
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-200 truncate">{nft.name || 'Unnamed NFT'}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">ID: {nft.tokenId}</p>
                  <p className="text-xs text-slate-600 font-mono truncate">{nft.contractAddress.slice(0, 8)}...{nft.contractAddress.slice(-4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}