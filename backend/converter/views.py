from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ConversionRequestSerializer
from .services import ConversionError, convert_uploaded_file


class ConvertView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ConversionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        uploaded = serializer.validated_data['file']

        try:
            envelope = convert_uploaded_file(
                uploaded,
                output_format=serializer.validated_data['output_format'],
                delimiter=serializer.validated_data['delimiter'],
                clean_missing=serializer.validated_data['clean_missing'],
                trim_columns=serializer.validated_data['trim_columns'],
                drop_dupes=serializer.validated_data['drop_duplicates'],
            )
        except ConversionError as exc:
            return Response({'detail': str(exc)}, status=400)
        except Exception:
            return Response({'detail': 'Terjadi kesalahan internal saat memproses berkas.'}, status=400)

        return Response(envelope)
