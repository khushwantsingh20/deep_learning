# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class CommonBodypartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    text = models.TextField(
        db_column="Text", blank=True, null=True
    )  # Field name made lowercase.
    format = models.CharField(
        db_column="Format", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Common_BodyPartRecord"


class CommonCommonpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    ownerid = models.IntegerField(
        db_column="OwnerId", blank=True, null=True
    )  # Field name made lowercase.
    createdutc = models.DateTimeField(
        db_column="CreatedUtc", blank=True, null=True
    )  # Field name made lowercase.
    publishedutc = models.DateTimeField(
        db_column="PublishedUtc", blank=True, null=True
    )  # Field name made lowercase.
    modifiedutc = models.DateTimeField(
        db_column="ModifiedUtc", blank=True, null=True
    )  # Field name made lowercase.
    container_id = models.IntegerField(
        db_column="Container_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Common_CommonPartRecord"


class CommonCommonpartversionrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    createdutc = models.DateTimeField(
        db_column="CreatedUtc", blank=True, null=True
    )  # Field name made lowercase.
    publishedutc = models.DateTimeField(
        db_column="PublishedUtc", blank=True, null=True
    )  # Field name made lowercase.
    modifiedutc = models.DateTimeField(
        db_column="ModifiedUtc", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Common_CommonPartVersionRecord"


class CommonIdentitypartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    identifier = models.CharField(
        db_column="Identifier", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Common_IdentityPartRecord"


class ContainersContainablepartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    position = models.IntegerField(
        db_column="Position", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Containers_ContainablePartRecord"


class ContainersContainerpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    paginated = models.BooleanField(
        db_column="Paginated", blank=True, null=True
    )  # Field name made lowercase.
    pagesize = models.IntegerField(
        db_column="PageSize", blank=True, null=True
    )  # Field name made lowercase.
    itemcontenttypes = models.CharField(
        db_column="ItemContentTypes", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    itemsshown = models.BooleanField(
        db_column="ItemsShown"
    )  # Field name made lowercase.
    showonadminmenu = models.BooleanField(
        db_column="ShowOnAdminMenu"
    )  # Field name made lowercase.
    adminmenutext = models.CharField(
        db_column="AdminMenuText", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    adminmenuposition = models.CharField(
        db_column="AdminMenuPosition", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    adminmenuimageset = models.CharField(
        db_column="AdminMenuImageSet", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    enablepositioning = models.BooleanField(
        db_column="EnablePositioning", blank=True, null=True
    )  # Field name made lowercase.
    adminlistviewname = models.CharField(
        db_column="AdminListViewName", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    itemcount = models.IntegerField(db_column="ItemCount")  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Containers_ContainerPartRecord"


class ContainersContainerwidgetpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    containerid = models.IntegerField(
        db_column="ContainerId", blank=True, null=True
    )  # Field name made lowercase.
    pagesize = models.IntegerField(
        db_column="PageSize", blank=True, null=True
    )  # Field name made lowercase.
    orderbyproperty = models.CharField(
        db_column="OrderByProperty", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    orderbydirection = models.IntegerField(
        db_column="OrderByDirection", blank=True, null=True
    )  # Field name made lowercase.
    applyfilter = models.BooleanField(
        db_column="ApplyFilter", blank=True, null=True
    )  # Field name made lowercase.
    filterbyproperty = models.CharField(
        db_column="FilterByProperty", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    filterbyoperator = models.CharField(
        db_column="FilterByOperator", max_length=4, blank=True, null=True
    )  # Field name made lowercase.
    filterbyvalue = models.CharField(
        db_column="FilterByValue", max_length=128, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Containers_ContainerWidgetPartRecord"


class NavigationAdminmenupartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    adminmenutext = models.CharField(
        db_column="AdminMenuText", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    adminmenuposition = models.CharField(
        db_column="AdminMenuPosition", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    onadminmenu = models.BooleanField(
        db_column="OnAdminMenu", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Navigation_AdminMenuPartRecord"


class NavigationMenupartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    menutext = models.CharField(
        db_column="MenuText", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    menuposition = models.CharField(
        db_column="MenuPosition", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    menuid = models.IntegerField(
        db_column="MenuId", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Navigation_MenuPartRecord"


class O8BootstrapcarouselBootstrapcarouselpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    count = models.SmallIntegerField(
        db_column="Count", blank=True, null=True
    )  # Field name made lowercase.
    groupid = models.IntegerField(
        db_column="GroupId", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "O8_BootstrapCarousel_BootstrapCarouselPartRecord"


class O8BootstrapcarouselImageitempartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    sort = models.SmallIntegerField(
        db_column="Sort", blank=True, null=True
    )  # Field name made lowercase.
    groupid = models.IntegerField(
        db_column="GroupId", blank=True, null=True
    )  # Field name made lowercase.
    captionstyling = models.CharField(
        db_column="CaptionStyling", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "O8_BootstrapCarousel_ImageItemPartRecord"


class O8SccdCarouselCarouselrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    outerdivid = models.CharField(
        db_column="OuterDivId", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    outerdivclass = models.CharField(
        db_column="OuterDivClass", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    imagedata = models.CharField(
        db_column="ImageData", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "O8_SCCD_Carousel_CarouselRecord"


class OrchardAliasActionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    area = models.CharField(
        db_column="Area", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    controller = models.CharField(
        db_column="Controller", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    action = models.CharField(
        db_column="Action", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Alias_ActionRecord"


class OrchardAliasAliasrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    path = models.CharField(
        db_column="Path", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    action_id = models.IntegerField(
        db_column="Action_id", blank=True, null=True
    )  # Field name made lowercase.
    routevalues = models.TextField(
        db_column="RouteValues", blank=True, null=True
    )  # Field name made lowercase.
    source = models.CharField(
        db_column="Source", max_length=256, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Alias_AliasRecord"


class OrchardAutorouteAutoroutepartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    custompattern = models.CharField(
        db_column="CustomPattern", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    usecustompattern = models.BooleanField(
        db_column="UseCustomPattern", blank=True, null=True
    )  # Field name made lowercase.
    displayalias = models.CharField(
        db_column="DisplayAlias", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Autoroute_AutoroutePartRecord"


class OrchardBlogsBlogarchivespartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    blogid = models.IntegerField(
        db_column="BlogId", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Blogs_BlogArchivesPartRecord"


class OrchardBlogsBlogpartarchiverecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    year = models.IntegerField(
        db_column="Year", blank=True, null=True
    )  # Field name made lowercase.
    month = models.IntegerField(
        db_column="Month", blank=True, null=True
    )  # Field name made lowercase.
    postcount = models.IntegerField(
        db_column="PostCount", blank=True, null=True
    )  # Field name made lowercase.
    blogpart_id = models.IntegerField(
        db_column="BlogPart_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Blogs_BlogPartArchiveRecord"


class OrchardBlogsRecentblogpostspartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    blogid = models.IntegerField(
        db_column="BlogId", blank=True, null=True
    )  # Field name made lowercase.
    count = models.IntegerField(
        db_column="Count", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Blogs_RecentBlogPostsPartRecord"


class OrchardCommentsCommentpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    author = models.CharField(
        db_column="Author", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    sitename = models.CharField(
        db_column="SiteName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    username = models.CharField(
        db_column="UserName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    email = models.CharField(
        db_column="Email", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    commentdateutc = models.DateTimeField(
        db_column="CommentDateUtc", blank=True, null=True
    )  # Field name made lowercase.
    commenttext = models.TextField(
        db_column="CommentText", blank=True, null=True
    )  # Field name made lowercase.
    commentedon = models.IntegerField(
        db_column="CommentedOn", blank=True, null=True
    )  # Field name made lowercase.
    commentedoncontainer = models.IntegerField(
        db_column="CommentedOnContainer", blank=True, null=True
    )  # Field name made lowercase.
    repliedon = models.IntegerField(
        db_column="RepliedOn", blank=True, null=True
    )  # Field name made lowercase.
    position = models.DecimalField(
        db_column="Position", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    commentspartrecord_id = models.IntegerField(
        db_column="CommentsPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Comments_CommentPartRecord"


class OrchardCommentsCommentspartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    commentsshown = models.BooleanField(
        db_column="CommentsShown", blank=True, null=True
    )  # Field name made lowercase.
    commentsactive = models.BooleanField(
        db_column="CommentsActive", blank=True, null=True
    )  # Field name made lowercase.
    threadedcomments = models.BooleanField(
        db_column="ThreadedComments", blank=True, null=True
    )  # Field name made lowercase.
    commentscount = models.IntegerField(
        db_column="CommentsCount", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Comments_CommentsPartRecord"


class OrchardContentpickerContentmenuitempartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentmenuitemrecord_id = models.IntegerField(
        db_column="ContentMenuItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_ContentPicker_ContentMenuItemPartRecord"


class OrchardCustomformsCustomformpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    contenttype = models.CharField(
        db_column="ContentType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    custommessage = models.BooleanField(
        db_column="CustomMessage", blank=True, null=True
    )  # Field name made lowercase.
    message = models.TextField(
        db_column="Message", blank=True, null=True
    )  # Field name made lowercase.
    redirect = models.BooleanField(
        db_column="Redirect", blank=True, null=True
    )  # Field name made lowercase.
    redirecturl = models.TextField(
        db_column="RedirectUrl", blank=True, null=True
    )  # Field name made lowercase.
    savecontentitem = models.BooleanField(
        db_column="SaveContentItem", blank=True, null=True
    )  # Field name made lowercase.
    submitbuttontext = models.CharField(
        db_column="SubmitButtonText", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_CustomForms_CustomFormPartRecord"


class OrchardFrameworkContentitemrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    data = models.TextField(
        db_column="Data", blank=True, null=True
    )  # Field name made lowercase.
    contenttype_id = models.IntegerField(
        db_column="ContentType_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Framework_ContentItemRecord"


class OrchardFrameworkContentitemversionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    number = models.IntegerField(
        db_column="Number", blank=True, null=True
    )  # Field name made lowercase.
    published = models.BooleanField(
        db_column="Published", blank=True, null=True
    )  # Field name made lowercase.
    latest = models.BooleanField(
        db_column="Latest", blank=True, null=True
    )  # Field name made lowercase.
    data = models.TextField(
        db_column="Data", blank=True, null=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Framework_ContentItemVersionRecord"


class OrchardFrameworkContenttyperecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Framework_ContentTypeRecord"


class OrchardFrameworkCulturerecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    culture = models.CharField(
        db_column="Culture", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Framework_CultureRecord"


class OrchardFrameworkDatamigrationrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    datamigrationclass = models.CharField(
        db_column="DataMigrationClass", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    version = models.IntegerField(
        db_column="Version", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Framework_DataMigrationRecord"


class OrchardLayoutsElementblueprint(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    baseelementtypename = models.CharField(
        db_column="BaseElementTypeName", max_length=256, blank=True, null=True
    )  # Field name made lowercase.
    elementtypename = models.CharField(
        db_column="ElementTypeName", max_length=256, blank=True, null=True
    )  # Field name made lowercase.
    elementdisplayname = models.CharField(
        db_column="ElementDisplayName", max_length=256, blank=True, null=True
    )  # Field name made lowercase.
    elementdescription = models.CharField(
        db_column="ElementDescription", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    elementcategory = models.CharField(
        db_column="ElementCategory", max_length=256, blank=True, null=True
    )  # Field name made lowercase.
    baseelementstate = models.TextField(
        db_column="BaseElementState", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Layouts_ElementBlueprint"


class OrchardLayoutsLayoutpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    templateid = models.IntegerField(
        db_column="TemplateId", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Layouts_LayoutPartRecord"


class OrchardMedialibraryMediapartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    mimetype = models.CharField(
        db_column="MimeType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    caption = models.TextField(
        db_column="Caption", blank=True, null=True
    )  # Field name made lowercase.
    alternatetext = models.TextField(
        db_column="AlternateText", blank=True, null=True
    )  # Field name made lowercase.
    folderpath = models.CharField(
        db_column="FolderPath", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    filename = models.CharField(
        db_column="FileName", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_MediaLibrary_MediaPartRecord"


class OrchardMediaprocessingFilenamerecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    path = models.TextField(
        db_column="Path", blank=True, null=True
    )  # Field name made lowercase.
    filename = models.TextField(
        db_column="FileName", blank=True, null=True
    )  # Field name made lowercase.
    imageprofilepartrecord_id = models.IntegerField(
        db_column="ImageProfilePartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_MediaProcessing_FileNameRecord"


class OrchardMediaprocessingFilterrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    position = models.IntegerField(
        db_column="Position", blank=True, null=True
    )  # Field name made lowercase.
    imageprofilepartrecord_id = models.IntegerField(
        db_column="ImageProfilePartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_MediaProcessing_FilterRecord"


class OrchardMediaprocessingImageprofilepartrecord(models.Model):
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_MediaProcessing_ImageProfilePartRecord"


class OrchardMediaMediasettingspartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    uploadallowedfiletypewhitelist = models.CharField(
        db_column="UploadAllowedFileTypeWhitelist",
        max_length=255,
        blank=True,
        null=True,
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Media_MediaSettingsPartRecord"


class OrchardOutputcacheCacheitemrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    cachedonutc = models.DateTimeField(
        db_column="CachedOnUtc", blank=True, null=True
    )  # Field name made lowercase.
    duration = models.IntegerField(
        db_column="Duration", blank=True, null=True
    )  # Field name made lowercase.
    gracetime = models.IntegerField(
        db_column="GraceTime", blank=True, null=True
    )  # Field name made lowercase.
    validuntilutc = models.DateTimeField(
        db_column="ValidUntilUtc", blank=True, null=True
    )  # Field name made lowercase.
    storeduntilutc = models.DateTimeField(
        db_column="StoredUntilUtc", blank=True, null=True
    )  # Field name made lowercase.
    output = models.BinaryField(
        db_column="Output", blank=True, null=True
    )  # Field name made lowercase.
    contenttype = models.CharField(
        db_column="ContentType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    querystring = models.CharField(
        db_column="QueryString", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    cachekey = models.CharField(
        db_column="CacheKey", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    invariantcachekey = models.CharField(
        db_column="InvariantCacheKey", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    url = models.CharField(
        db_column="Url", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.
    tenant = models.CharField(
        db_column="Tenant", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    statuscode = models.IntegerField(
        db_column="StatusCode", blank=True, null=True
    )  # Field name made lowercase.
    tags = models.TextField(
        db_column="Tags", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_OutputCache_CacheItemRecord"


class OrchardOutputcacheCacheparameterrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    duration = models.IntegerField(
        db_column="Duration", blank=True, null=True
    )  # Field name made lowercase.
    gracetime = models.IntegerField(
        db_column="GraceTime", blank=True, null=True
    )  # Field name made lowercase.
    routekey = models.CharField(
        db_column="RouteKey", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_OutputCache_CacheParameterRecord"


class OrchardPackagingPackagingsource(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    feedtitle = models.CharField(
        db_column="FeedTitle", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    feedurl = models.CharField(
        db_column="FeedUrl", max_length=2048, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Packaging_PackagingSource"


class OrchardProjectionsDecimalfieldindexrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    propertyname = models.CharField(
        db_column="PropertyName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    value = models.DecimalField(
        db_column="Value", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    fieldindexpartrecord_id = models.IntegerField(
        db_column="FieldIndexPartRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_DecimalFieldIndexRecord"


class OrchardProjectionsDoublefieldindexrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    propertyname = models.CharField(
        db_column="PropertyName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    value = models.FloatField(
        db_column="Value", blank=True, null=True
    )  # Field name made lowercase.
    fieldindexpartrecord_id = models.IntegerField(
        db_column="FieldIndexPartRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_DoubleFieldIndexRecord"


class OrchardProjectionsFieldindexpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_FieldIndexPartRecord"


class OrchardProjectionsFiltergrouprecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    querypartrecord_id = models.IntegerField(
        db_column="QueryPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_FilterGroupRecord"


class OrchardProjectionsFilterrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    position = models.IntegerField(
        db_column="Position", blank=True, null=True
    )  # Field name made lowercase.
    filtergrouprecord_id = models.IntegerField(
        db_column="FilterGroupRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_FilterRecord"


class OrchardProjectionsIntegerfieldindexrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    propertyname = models.CharField(
        db_column="PropertyName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    value = models.BigIntegerField(
        db_column="Value", blank=True, null=True
    )  # Field name made lowercase.
    fieldindexpartrecord_id = models.IntegerField(
        db_column="FieldIndexPartRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_IntegerFieldIndexRecord"


class OrchardProjectionsLayoutrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    displaytype = models.CharField(
        db_column="DisplayType", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    display = models.IntegerField(
        db_column="Display", blank=True, null=True
    )  # Field name made lowercase.
    querypartrecord_id = models.IntegerField(
        db_column="QueryPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    groupproperty_id = models.IntegerField(
        db_column="GroupProperty_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_LayoutRecord"


class OrchardProjectionsMemberbindingrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    member = models.CharField(
        db_column="Member", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=500, blank=True, null=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=64, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_MemberBindingRecord"


class OrchardProjectionsNavigationquerypartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    items = models.IntegerField(
        db_column="Items", blank=True, null=True
    )  # Field name made lowercase.
    skip = models.IntegerField(
        db_column="Skip", blank=True, null=True
    )  # Field name made lowercase.
    querypartrecord_id = models.IntegerField(
        db_column="QueryPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_NavigationQueryPartRecord"


class OrchardProjectionsProjectionpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    items = models.IntegerField(
        db_column="Items", blank=True, null=True
    )  # Field name made lowercase.
    itemsperpage = models.IntegerField(
        db_column="ItemsPerPage", blank=True, null=True
    )  # Field name made lowercase.
    skip = models.IntegerField(
        db_column="Skip", blank=True, null=True
    )  # Field name made lowercase.
    pagersuffix = models.CharField(
        db_column="PagerSuffix", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    maxitems = models.IntegerField(
        db_column="MaxItems", blank=True, null=True
    )  # Field name made lowercase.
    displaypager = models.BooleanField(
        db_column="DisplayPager", blank=True, null=True
    )  # Field name made lowercase.
    querypartrecord_id = models.IntegerField(
        db_column="QueryPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    layoutrecord_id = models.IntegerField(
        db_column="LayoutRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_ProjectionPartRecord"


class OrchardProjectionsPropertyrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    position = models.IntegerField(
        db_column="Position", blank=True, null=True
    )  # Field name made lowercase.
    layoutrecord_id = models.IntegerField(
        db_column="LayoutRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    excludefromdisplay = models.BooleanField(
        db_column="ExcludeFromDisplay", blank=True, null=True
    )  # Field name made lowercase.
    createlabel = models.BooleanField(
        db_column="CreateLabel", blank=True, null=True
    )  # Field name made lowercase.
    label = models.CharField(
        db_column="Label", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    linktocontent = models.BooleanField(
        db_column="LinkToContent", blank=True, null=True
    )  # Field name made lowercase.
    customizepropertyhtml = models.BooleanField(
        db_column="CustomizePropertyHtml", blank=True, null=True
    )  # Field name made lowercase.
    custompropertytag = models.CharField(
        db_column="CustomPropertyTag", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    custompropertycss = models.CharField(
        db_column="CustomPropertyCss", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    customizelabelhtml = models.BooleanField(
        db_column="CustomizeLabelHtml", blank=True, null=True
    )  # Field name made lowercase.
    customlabeltag = models.CharField(
        db_column="CustomLabelTag", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    customlabelcss = models.CharField(
        db_column="CustomLabelCss", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    customizewrapperhtml = models.BooleanField(
        db_column="CustomizeWrapperHtml", blank=True, null=True
    )  # Field name made lowercase.
    customwrappertag = models.CharField(
        db_column="CustomWrapperTag", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    customwrappercss = models.CharField(
        db_column="CustomWrapperCss", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    noresulttext = models.TextField(
        db_column="NoResultText", blank=True, null=True
    )  # Field name made lowercase.
    zeroisempty = models.BooleanField(
        db_column="ZeroIsEmpty", blank=True, null=True
    )  # Field name made lowercase.
    hideempty = models.BooleanField(
        db_column="HideEmpty", blank=True, null=True
    )  # Field name made lowercase.
    rewriteoutput = models.BooleanField(
        db_column="RewriteOutput", blank=True, null=True
    )  # Field name made lowercase.
    rewritetext = models.TextField(
        db_column="RewriteText", blank=True, null=True
    )  # Field name made lowercase.
    striphtmltags = models.BooleanField(
        db_column="StripHtmlTags", blank=True, null=True
    )  # Field name made lowercase.
    trimlength = models.BooleanField(
        db_column="TrimLength", blank=True, null=True
    )  # Field name made lowercase.
    addellipsis = models.BooleanField(
        db_column="AddEllipsis", blank=True, null=True
    )  # Field name made lowercase.
    maxlength = models.IntegerField(
        db_column="MaxLength", blank=True, null=True
    )  # Field name made lowercase.
    trimonwordboundary = models.BooleanField(
        db_column="TrimOnWordBoundary", blank=True, null=True
    )  # Field name made lowercase.
    preservelines = models.BooleanField(
        db_column="PreserveLines", blank=True, null=True
    )  # Field name made lowercase.
    trimwhitespace = models.BooleanField(
        db_column="TrimWhiteSpace", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_PropertyRecord"


class OrchardProjectionsQuerypartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_QueryPartRecord"


class OrchardProjectionsSortcriterionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    category = models.CharField(
        db_column="Category", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    type = models.CharField(
        db_column="Type", max_length=64, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    position = models.IntegerField(
        db_column="Position", blank=True, null=True
    )  # Field name made lowercase.
    querypartrecord_id = models.IntegerField(
        db_column="QueryPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_SortCriterionRecord"


class OrchardProjectionsStringfieldindexrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    propertyname = models.CharField(
        db_column="PropertyName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    value = models.CharField(
        db_column="Value", max_length=4000, blank=True, null=True
    )  # Field name made lowercase.
    fieldindexpartrecord_id = models.IntegerField(
        db_column="FieldIndexPartRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Projections_StringFieldIndexRecord"


class OrchardRolesPermissionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    featurename = models.CharField(
        db_column="FeatureName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Roles_PermissionRecord"


class OrchardRolesRolerecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Roles_RoleRecord"


class OrchardRolesRolespermissionsrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    role_id = models.IntegerField(
        db_column="Role_id", blank=True, null=True
    )  # Field name made lowercase.
    permission_id = models.IntegerField(
        db_column="Permission_id", blank=True, null=True
    )  # Field name made lowercase.
    rolerecord_id = models.IntegerField(
        db_column="RoleRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Roles_RolesPermissionsRecord"


class OrchardRolesUserrolespartrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    userid = models.IntegerField(
        db_column="UserId", blank=True, null=True
    )  # Field name made lowercase.
    role_id = models.IntegerField(
        db_column="Role_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Roles_UserRolesPartRecord"


class OrchardTagsContenttagrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    tagrecord_id = models.IntegerField(
        db_column="TagRecord_Id", blank=True, null=True
    )  # Field name made lowercase.
    tagspartrecord_id = models.IntegerField(
        db_column="TagsPartRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Tags_ContentTagRecord"


class OrchardTagsTagrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    tagname = models.CharField(
        db_column="TagName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Tags_TagRecord"


class OrchardTagsTagspartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Tags_TagsPartRecord"


class OrchardTaxonomiesTaxonomypartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    termtypename = models.CharField(
        db_column="TermTypeName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    isinternal = models.BooleanField(
        db_column="IsInternal", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Taxonomies_TaxonomyPartRecord"


class OrchardTaxonomiesTermcontentitem(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    field = models.CharField(
        db_column="Field", max_length=50, blank=True, null=True
    )  # Field name made lowercase.
    termrecord_id = models.IntegerField(
        db_column="TermRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    termspartrecord_id = models.IntegerField(
        db_column="TermsPartRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Taxonomies_TermContentItem"


class OrchardTaxonomiesTermpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    path = models.CharField(
        db_column="Path", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    taxonomyid = models.IntegerField(
        db_column="TaxonomyId", blank=True, null=True
    )  # Field name made lowercase.
    count = models.IntegerField(
        db_column="Count", blank=True, null=True
    )  # Field name made lowercase.
    weight = models.IntegerField(
        db_column="Weight", blank=True, null=True
    )  # Field name made lowercase.
    selectable = models.BooleanField(
        db_column="Selectable", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Taxonomies_TermPartRecord"


class OrchardTaxonomiesTermspartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Taxonomies_TermsPartRecord"


class OrchardUsersUserpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    username = models.CharField(
        db_column="UserName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    email = models.CharField(
        db_column="Email", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    normalizedusername = models.CharField(
        db_column="NormalizedUserName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    password = models.CharField(
        db_column="Password", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    passwordformat = models.CharField(
        db_column="PasswordFormat", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    hashalgorithm = models.CharField(
        db_column="HashAlgorithm", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    passwordsalt = models.CharField(
        db_column="PasswordSalt", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    registrationstatus = models.CharField(
        db_column="RegistrationStatus", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    emailstatus = models.CharField(
        db_column="EmailStatus", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    emailchallengetoken = models.CharField(
        db_column="EmailChallengeToken", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Users_UserPartRecord"


class OrchardWidgetsLayerpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    description = models.TextField(
        db_column="Description", blank=True, null=True
    )  # Field name made lowercase.
    layerrule = models.TextField(
        db_column="LayerRule", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Widgets_LayerPartRecord"


class OrchardWidgetsWidgetpartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    position = models.CharField(
        db_column="Position", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    zone = models.CharField(
        db_column="Zone", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    rendertitle = models.BooleanField(
        db_column="RenderTitle", blank=True, null=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Widgets_WidgetPartRecord"


class OrchardWorkflowsActivityrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    x = models.IntegerField(
        db_column="X", blank=True, null=True
    )  # Field name made lowercase.
    y = models.IntegerField(
        db_column="Y", blank=True, null=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    start = models.BooleanField(
        db_column="Start", blank=True, null=True
    )  # Field name made lowercase.
    workflowdefinitionrecord_id = models.IntegerField(
        db_column="WorkflowDefinitionRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Workflows_ActivityRecord"


class OrchardWorkflowsAwaitingactivityrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    activityrecord_id = models.IntegerField(
        db_column="ActivityRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    workflowrecord_id = models.IntegerField(
        db_column="WorkflowRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Workflows_AwaitingActivityRecord"


class OrchardWorkflowsTransitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    sourceendpoint = models.CharField(
        db_column="SourceEndpoint", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    destinationendpoint = models.CharField(
        db_column="DestinationEndpoint", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    sourceactivityrecord_id = models.IntegerField(
        db_column="SourceActivityRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    destinationactivityrecord_id = models.IntegerField(
        db_column="DestinationActivityRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    workflowdefinitionrecord_id = models.IntegerField(
        db_column="WorkflowDefinitionRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Workflows_TransitionRecord"


class OrchardWorkflowsWorkflowdefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    enabled = models.BooleanField(
        db_column="Enabled", blank=True, null=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=1024, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Workflows_WorkflowDefinitionRecord"


class OrchardWorkflowsWorkflowrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    state = models.TextField(
        db_column="State", blank=True, null=True
    )  # Field name made lowercase.
    workflowdefinitionrecord_id = models.IntegerField(
        db_column="WorkflowDefinitionRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orchard_Workflows_WorkflowRecord"


class SchedulingScheduledtaskrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    tasktype = models.CharField(
        db_column="TaskType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    scheduledutc = models.DateTimeField(
        db_column="ScheduledUtc", blank=True, null=True
    )  # Field name made lowercase.
    contentitemversionrecord_id = models.IntegerField(
        db_column="ContentItemVersionRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Scheduling_ScheduledTaskRecord"


class SettingsContentfielddefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ContentFieldDefinitionRecord"


class SettingsContentpartdefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    hidden = models.BooleanField(
        db_column="Hidden", blank=True, null=True
    )  # Field name made lowercase.
    settings = models.TextField(
        db_column="Settings", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ContentPartDefinitionRecord"


class SettingsContentpartfielddefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    settings = models.TextField(
        db_column="Settings", blank=True, null=True
    )  # Field name made lowercase.
    contentfielddefinitionrecord_id = models.IntegerField(
        db_column="ContentFieldDefinitionRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    contentpartdefinitionrecord_id = models.IntegerField(
        db_column="ContentPartDefinitionRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ContentPartFieldDefinitionRecord"


class SettingsContenttypedefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    displayname = models.CharField(
        db_column="DisplayName", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    hidden = models.BooleanField(
        db_column="Hidden", blank=True, null=True
    )  # Field name made lowercase.
    settings = models.TextField(
        db_column="Settings", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ContentTypeDefinitionRecord"


class SettingsContenttypepartdefinitionrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    settings = models.TextField(
        db_column="Settings", blank=True, null=True
    )  # Field name made lowercase.
    contentpartdefinitionrecord_id = models.IntegerField(
        db_column="ContentPartDefinitionRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    contenttypedefinitionrecord_id = models.IntegerField(
        db_column="ContentTypeDefinitionRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ContentTypePartDefinitionRecord"


class SettingsShelldescriptorrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    serialnumber = models.IntegerField(
        db_column="SerialNumber", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ShellDescriptorRecord"


class SettingsShellfeaturerecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    shelldescriptorrecord_id = models.IntegerField(
        db_column="ShellDescriptorRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ShellFeatureRecord"


class SettingsShellfeaturestaterecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    installstate = models.CharField(
        db_column="InstallState", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    enablestate = models.CharField(
        db_column="EnableState", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    shellstaterecord_id = models.IntegerField(
        db_column="ShellStateRecord_Id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ShellFeatureStateRecord"


class SettingsShellparameterrecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    component = models.CharField(
        db_column="Component", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    value = models.CharField(
        db_column="Value", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    shelldescriptorrecord_id = models.IntegerField(
        db_column="ShellDescriptorRecord_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ShellParameterRecord"


class SettingsShellstaterecord(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    unused = models.CharField(
        db_column="Unused", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Settings_ShellStateRecord"


class TitleTitlepartrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    contentitemrecord_id = models.IntegerField(
        db_column="ContentItemRecord_id", blank=True, null=True
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=1024, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Title_TitlePartRecord"


class VxsolutionsOrchardMetatagsMetatagsrecord(models.Model):
    id = models.IntegerField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    keywords = models.CharField(
        db_column="Keywords", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    keywordsinherited = models.BooleanField(
        db_column="KeywordsInherited", blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    descriptioninherited = models.BooleanField(
        db_column="DescriptionInherited", blank=True, null=True
    )  # Field name made lowercase.
    metatag1name = models.CharField(
        db_column="MetaTag1Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    metatag1value = models.CharField(
        db_column="MetaTag1Value", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    metatag1inherited = models.BooleanField(
        db_column="MetaTag1Inherited", blank=True, null=True
    )  # Field name made lowercase.
    metatag2name = models.CharField(
        db_column="MetaTag2Name", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    metatag2value = models.CharField(
        db_column="MetaTag2Value", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    metatag2inherited = models.BooleanField(
        db_column="MetaTag2Inherited", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "VXSolutions_Orchard_MetaTags_MetaTagsRecord"
