import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerOrdersApi, customerClaimsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createClaimSchema, type CreateClaimFormData } from '@/lib/validations';
import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

export default function CreateClaim() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [previewImages, setPreviewImages] = useState<Array<{ file: File; url: string }>>([]);

  const form = useForm<CreateClaimFormData>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      order_id: '',
      claim_type: undefined,
      description: '',
      files: undefined,
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['orders-delivered'],
    queryFn: () => customerOrdersApi.getOrders({ status: 'delivered' }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    const newPreviews = newFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    // Combine with existing previews
    const allPreviews = [...previewImages, ...newPreviews];
    setPreviewImages(allPreviews);
    
    // Update form with all files
    const existingFiles = form.getValues('files') ? Array.from(form.getValues('files') as FileList) : [];
    const allFiles = [...existingFiles, ...newFiles];
    
    // Create a new FileList-like structure for the form
    // Since we can't create a real FileList, we'll store as array and handle in submit
    form.setValue('files', allFiles as any);
  };

  const removeImage = (index: number) => {
    const removedPreview = previewImages[index];
    URL.revokeObjectURL(removedPreview.url);
    
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    // Update form files - remove the file at the same index
    const currentFiles = form.getValues('files') ? Array.from(form.getValues('files') as FileList) : [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue('files', newFiles.length > 0 ? (newFiles as any) : undefined);
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateClaimFormData) => {
      const formData = new FormData();
      
      // All parameters should be in FormData, not query parameters
      formData.append('order_id', data.order_id);
      formData.append('claim_type', data.claim_type);
      formData.append('description', data.description);
      
      // Append files from previewImages state (more reliable than form data)
      // FastAPI expects them as a list, so we append each file with the same key 'files'
      if (previewImages.length > 0) {
        for (const preview of previewImages) {
          formData.append('files', preview.file);
        }
      }

      return customerClaimsApi.createClaim(formData);
    },
    onSuccess: (data) => {
      // Clean up preview URLs
      previewImages.forEach(preview => URL.revokeObjectURL(preview.url));
      setPreviewImages([]);
      toast({ title: 'Claim created successfully' });
      navigate(`/customer/claims/${data.claim_id}`);
    },
    onError: (error: any) => {
      // Extract error message from validation errors
      let errorMessage = 'Failed to create claim';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Validation errors - extract messages
          errorMessage = detail.map((err: any) => {
            const field = err.loc?.slice(1).join('.') || 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateClaimFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create New Claim</h1>

      <Card>
        <CardHeader>
          <CardTitle>Claim Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Order *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a delivered order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orders && orders.length > 0 ? (
                          orders.map((order: any) => {
                            const deliveryDate = order.delivery_date ? new Date(order.delivery_date) : null;
                            const isValidDate = deliveryDate && !isNaN(deliveryDate.getTime());
                            const formattedDate = isValidDate ? deliveryDate.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'Unknown date';
                            
                            return (
                              <SelectItem key={order.order_id} value={order.order_id}>
                                Order delivered on {formattedDate}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">No delivered orders available</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="claim_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MISSING_ITEM">Missing Item</SelectItem>
                        <SelectItem value="DAMAGED_ITEM">Damaged Item</SelectItem>
                        <SelectItem value="WRONG_ITEM">Wrong Item</SelectItem>
                        <SelectItem value="QUALITY_ISSUE">Quality Issue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue in detail..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="files"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Upload Evidence (Images)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        {...field}
                        onChange={handleFileChange}
                        value="" // Controlled input - value is always empty, we manage files via state
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      You can upload multiple images to support your claim
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Images ({previewImages.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group border rounded-lg overflow-hidden">
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {preview.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || form.formState.isSubmitting}>
                  {createMutation.isPending ? 'Creating...' : 'Create Claim'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/customer/claims')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
