import { useState } from "react";
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
import { Plus, Trash2, Loader2 } from "lucide-react";
import { STRATEGIES, strategyTypes, type StrategyType, insertTradeSchema, tradeLegSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

const formSchema = insertTradeSchema.omit({ userId: true }).extend({
  ticker: z.string().min(1, "Ticker is required").max(10),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().positive().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  maxProfit: z.coerce.number().optional().or(z.literal("")),
  maxLoss: z.coerce.number().optional().or(z.literal("")),
  shared: z.boolean().default(false),
  legs: z.array(tradeLegSchema.extend({
    strike: z.coerce.number().optional().or(z.literal("")),
    premium: z.coerce.number().optional().or(z.literal("")),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

const categoryGroups = [
  { label: "Simple Options", category: "simple" },
  { label: "Vertical Spreads", category: "vertical" },
  { label: "Multi-Leg Strategies", category: "advanced" },
];

export function NewTradeForm({ open, onOpenChange, onSubmit, isSubmitting }: NewTradeFormProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>("LONG_CALL");
  const strategyInfo = STRATEGIES[selectedStrategy];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "",
      strategy: "LONG_CALL",
      status: "OPEN",
      entryPrice: "" as any,
      exitPrice: "",
      quantity: 1,
      entryDate: new Date().toISOString().split("T")[0],
      exitDate: "",
      notes: "",
      maxProfit: "",
      maxLoss: "",
      shared: false,
      legs: [{ type: "CALL", action: "BUY", quantity: 1, strike: "", expiration: "", premium: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "legs",
  });

  const handleStrategyChange = (strategy: StrategyType) => {
    setSelectedStrategy(strategy);
    form.setValue("strategy", strategy);
    const info = STRATEGIES[strategy];
    
    const defaultLegs = [];
    for (let i = 0; i < info.legs; i++) {
      defaultLegs.push({
        type: strategy === "STOCK" ? "STOCK" as const : (i % 2 === 0 ? "CALL" : "PUT") as const,
        action: i % 2 === 0 ? "BUY" as const : "SELL" as const,
        quantity: 1,
        strike: "" as any,
        expiration: "",
        premium: "" as any,
      });
    }
    form.setValue("legs", defaultLegs);
  };

  const handleSubmit = async (values: FormValues) => {
    const cleanedData = {
      ...values,
      ticker: values.ticker.toUpperCase(),
      entryPrice: Number(values.entryPrice),
      exitPrice: values.exitPrice === "" || values.exitPrice === undefined ? null : Number(values.exitPrice),
      quantity: Number(values.quantity),
      maxProfit: values.maxProfit === "" || values.maxProfit === undefined ? null : Number(values.maxProfit),
      maxLoss: values.maxLoss === "" || values.maxLoss === undefined ? null : Number(values.maxLoss),
      shared: false,
      legs: values.legs.map(leg => ({
        ...leg,
        quantity: Number(leg.quantity),
        strike: leg.strike === "" || leg.strike === undefined ? null : Number(leg.strike),
        premium: leg.premium === "" || leg.premium === undefined ? null : Number(leg.premium),
      })),
    };
    try {
      await onSubmit(cleanedData as any);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Trade submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{strategyInfo.emoji}</span>
            Log New Trade
          </DialogTitle>
          <DialogDescription>
            Share your trade with the team. Select a strategy and fill in the details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="strategy"
              render={() => (
                <FormItem>
                  <FormLabel>Strategy</FormLabel>
                  <div className="space-y-3">
                    {categoryGroups.map((group) => (
                      <div key={group.category}>
                        <p className="text-xs text-muted-foreground mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {strategyTypes
                            .filter((s) => STRATEGIES[s].category === group.category)
                            .map((strategy) => {
                              const info = STRATEGIES[strategy];
                              const isSelected = selectedStrategy === strategy;
                              return (
                                <Badge
                                  key={strategy}
                                  variant={isSelected ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    isSelected && "ring-2 ring-ring ring-offset-1"
                                  )}
                                  onClick={() => handleStrategyChange(strategy)}
                                  data-testid={`button-strategy-${strategy}`}
                                >
                                  <span className="mr-1">{info.emoji}</span>
                                  {info.name}
                                </Badge>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AAPL"
                        {...field}
                        className="uppercase"
                        data-testid="input-ticker"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contracts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        data-testid="input-quantity"
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
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-entry-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-entry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-exit-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Trade Legs</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ type: "CALL", action: "BUY", quantity: 1, strike: "" as any, expiration: "", premium: "" as any })}
                  data-testid="button-add-leg"
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
                            <SelectTrigger data-testid={`select-leg-action-${index}`}>
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
                            <SelectTrigger data-testid={`select-leg-type-${index}`}>
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
                            data-testid={`input-leg-quantity-${index}`}
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
                            data-testid={`input-leg-strike-${index}`}
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
                            data-testid={`input-leg-expiration-${index}`}
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
                        data-testid={`button-remove-leg-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Profit (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="1000"
                        {...field}
                        data-testid="input-max-profit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Loss (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="500"
                        {...field}
                        data-testid="input-max-loss"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thesis, reasoning, or any notes about this trade..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-notes"
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
                data-testid="button-cancel-trade"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-trade">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post Trade
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
