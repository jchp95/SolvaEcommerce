import apiClient from '../client';

export const SiteSettingsService = {
    get: async () => {
        try {
            const response = await apiClient.get('/sitesettings');
            return response.data;
        } catch (error) {
            console.error("Error fetching site settings:", error);
            throw error;
        }
    },

    update: async (data) => {
        try {
            const response = await apiClient.put('/sitesettings', data);
            return response.data;
        } catch (error) {
            console.error("Error updating site settings:", error);
            throw error;
        }
    }
};
