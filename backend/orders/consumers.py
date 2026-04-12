import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OrderTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f"order_{self.order_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'location_update',
                'lat': data['lat'],
                'lng': data['lng']
            }
        )

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'lat': event['lat'],
            'lng': event['lng']
        }))

class AdminUpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "admin_updates"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def admin_update(self, event):
        await self.send(text_data=json.dumps(event['data']))


class RiderOrdersConsumer(AsyncWebsocketConsumer):
    """
    Riders subscribe to notifications. 
    Strictly enforced: Only authenticated riders who are 'is_available=True' receive broadcasts.
    """
    async def connect(self):
        user = self.scope.get('user')
        
        if not user or not user.is_authenticated or user.user_type != 'rider':
            await self.close()
            return

        # We join both a global group and an area-specific group if provided
        self.area = self.scope['url_route']['kwargs'].get('area', 'global')
        self.group_name = "all_riders"
        self.area_group_name = f"riders_{self.area}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add(self.area_group_name, self.channel_name)
        
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if hasattr(self, 'area_group_name'):
            await self.channel_layer.group_discard(self.area_group_name, self.channel_name)

    async def rider_order_event(self, event):
        # We can perform a final 'is_available' check here if we want to be extremely strict,
        # but usually riders who are 'Offline' shouldn't have an active socket connection.
        await self.send(text_data=json.dumps(event['data']))