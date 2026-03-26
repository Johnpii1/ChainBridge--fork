"use client";

import { Order, OrderSide } from "@/types";
import { Modal, Button, Badge } from "@/components/ui";
import { ArrowRight, Zap, ShieldCheck, Info } from "lucide-react";

interface OrderTakeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (order: Order) => void;
}

export function OrderTakeModal({ order, isOpen, onClose, onConfirm }: OrderTakeModalProps) {
  if (!order) return null;

  const isBuy = order.side === OrderSide.BUY;

  return (
    <Modal open={isOpen} onClose={onClose} title="Execute Swap Order">
      <div className="space-y-6 pt-2">
        <div className="rounded-2xl bg-surface-overlay p-6 border border-border shadow-inner">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">
                You Give
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-text-primary">
                  {isBuy ? order.total : order.amount}
                </span>
                <span className="text-sm font-bold text-brand-500">
                  {isBuy ? order.tokenOut : order.tokenIn}
                </span>
              </div>
              <Badge
                variant="chain"
                chain={isBuy ? order.chainOut : order.chainIn}
                className="w-fit mt-1"
              >
                {isBuy ? order.chainOut : order.chainIn}
              </Badge>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <ArrowRight />
            </div>

            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest text-right">
                You Receive
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-500">
                  {isBuy ? order.amount : order.total}
                </span>
                <span className="text-sm font-bold text-emerald-500/80">
                  {isBuy ? order.tokenIn : order.tokenOut}
                </span>
              </div>
              <Badge
                variant="chain"
                chain={isBuy ? order.chainIn : order.chainOut}
                className="w-fit mt-1 text-right"
              >
                {isBuy ? order.chainIn : order.chainOut}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
            <span className="text-text-muted">Execution Price</span>
            <span className="font-mono font-bold text-text-primary">
              1 {order.tokenIn} = {order.price} {order.tokenOut}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              Safe Swap
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              Uses Hashed Timelock Contracts. Funds are only released if proofs are provided.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-1">
              <Zap size={14} className="text-brand-500" />
              Instant Fill
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              This order is ready to be taken immediately from the current liquidity pool.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            className="w-full h-12 text-lg shadow-glow-md"
            onClick={() => onConfirm(order)}
            icon={<Zap size={20} />}
          >
            Confirm & Swap
          </Button>
          <Button variant="ghost" className="w-full text-text-muted" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-surface-overlay border border-border/50 p-3">
          <Info size={16} className="text-brand-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-text-secondary">
            By confirming, you will initiate a lock transaction on{" "}
            {isBuy ? order.chainOut : order.chainIn}. Ensure you have sufficient balance for the
            swap amount and network fees.
          </p>
        </div>
      </div>
    </Modal>
  );
}
