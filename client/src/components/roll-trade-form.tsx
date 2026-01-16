import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Loader2, RotateCcw } from "lucide-react";
import { STRATEGIES, type StrategyType, tradeLegSchema, type Trade } from "@shared/schema";

const rollFormSchema = z.object({
  parentExitPrice: z.coerce.number().positive("Exit price for original position is required"),
  parentExitDate: z.string().min(1, "Exit date is required"),
  ticker: z.string().min(1).max(10),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  entryDate: z.string(),
  notes: z.string().optional(),
  legs: z.array(tradeLegSchema.extend({
    strike: z.coerce.number().optional().or(z.literal("")),
    premium: z.coerce.number().optional().or(z.literal("")),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

type RollFormValues = z.infer<typeof rollFormSchema>;

interface RollTradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (parentTradeId: string, data: any) => Promise<void>;
  isSubmitting: boolean;
  parentTrade: Trade | null;
}

export function RollTradeForm({ open, onOpenChange, onSubmit, isSubmitting, parentTrade }: RollTradeFormProps) {
  if (!parentTrade) return null;

  const strategyInfo = STRATEGIES[parentTrade.strategy];

  const getDefaultValues = () => ({
    parentExitPrice: "" as any,
    parentExitDate: new Date().toISOString().split("T")[0],
    ticker: parentTrade.ticker,
    entryPrice: "" as any,
    quantity: parentTrade.quantity,
    entryDate: new Date().toISOString().split("T")[0],
    notes: `Rolled from ${formatLegSummary(parentTrade)}`,
    legs: parentTrade.legs.map(leg => ({
      ...leg,
      strike: "" as any,
      premium: "" as any,
      expiration: "",
    })),
  });

  const form = useForm<RollFormValues>({
    resolver: zodResolver(rollFormSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open && parentTrade) {
      form.reset(getDefaultValues());
    }
  }, [open, parentTrade]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "legs",
  });

  const handleSubmit = async (values: RollFormValues) => {
    const cleanedData = {
      ticker: values.ticker.toUpperCase(),
      strategy: parentTrade.strategy,
      status: "OPEN",
      entryPrice: Number(values.entryPrice),
      quantity: Number(values.quantity),
      entryDate: values.entryDate,
      notes: values.notes || "",
      shared: parentTrade.shared,
      legs: values.legs.map(leg => ({
        ...leg,
        quantity: Number(leg.quantity),
        strike: leg.strike === "" || leg.strike === undefined ? null : Number(leg.strike),
        premium: leg.premium === "" || leg.premium === undefined ? null : Number(leg.premium),
      })),
      parentExitPrice: Number(values.parentExitPrice),
      parentExitDate: values.parentExitDate,
    };
    
    try {
      await onSubmit(parentTrade.id, cleanedData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Roll submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-500" />
            Roll Position
          </DialogTitle>
          <DialogDescription>
            Close your current position and open a new one at different strikes/expiration.
          </DialogDescription>
        </DialogHeader>

        <Card className="p-4 bg-muted/50 mb-4">
          <div className="text-sm font-medium mb-2">Closing Position:</div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{strategyInfo.name}</Badge>
            <span className="font-bold">{parentTrade.ticker}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatLegSummary(parentTrade)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Entry: ${parentTrade.entryPrice.toFixed(2)} x {parentTrade.quantity} contracts
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="border-l-4 border-red-500 pl-4 py-2 space-y-4">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">Closing Details</div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentExitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Price (Original)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-parent-exit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentExitDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-parent-exit-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4 py-2 space-y-4">
              <div className="text-sm font-medium text-green-600 dark:text-green-400">New Position</div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{parentTrade.strategy === "STOCK" ? "Shares" : "Contracts"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          data-testid="input-roll-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Price (New)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-roll-entry-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date (New)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-roll-entry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>New Trade Legs</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ type: "CALL", action: "BUY", quantity: 1, strike: "" as any, expiration: "", premium: "" as any })}
                    data-testid="button-add-roll-leg"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Leg
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-md bg-muted/50">
                    <FormField
                      control={form.control}
                      name={`legs.${index}.action`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs">Action</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-roll-leg-action-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BUY">Buy</SelectItem>
                              <SelectItem value="SELL">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`legs.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-roll-leg-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CALL">Call</SelectItem>
                              <SelectItem value="PUT">Put</SelectItem>
                              <SelectItem value="STOCK">Stock</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`legs.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs">Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              data-testid={`input-roll-leg-quantity-${index}`}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`legs.${index}.strike`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-xs">Strike</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="150"
                              {...field}
                              data-testid={`input-roll-leg-strike-${index}`}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`legs.${index}.expiration`}
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel className="text-xs">Expiration</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid={`input-roll-leg-expiration-${index}`}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive"
                          data-testid={`button-remove-roll-leg-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for rolling, new thesis..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-roll-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-roll"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-submit-roll"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Roll Position
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function formatLegSummary(trade: Trade): string {
  return trade.legs.map(leg => {
    if (leg.type === "STOCK") return `${leg.action} ${leg.quantity} shares`;
    const strike = leg.strike ? `$${leg.strike}` : "";
    const exp = leg.expiration ? new Date(leg.expiration + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";
    return `${leg.action} ${leg.quantity}x ${strike} ${leg.type} ${exp}`;
  }).join(" / ");
}
